import { NextResponse } from "next/server";

import { attribuerRole } from "@/app/application/utilisateur/utilsateurRole/attribuerRole";
import { retirerRole } from "@/app/application/utilisateur/utilsateurRole/retirerRole";
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import {
  canAssignRoleFromContext,
  getAccessControlGovernanceContext,
} from "@/server/access/access-control-governance";
import { canAccessAgentForPermissions } from "@/server/access/scope";

async function ensureRoleAssignmentAccess() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { auth: null, response: NextResponse.json({ message: "Non authentifie" }, { status: 401 }) };
  }

  try {
    await requireAccess({
      permissions: ["user.update", "role.update"],
    });
  } catch {
    return { auth: null, response: NextResponse.json({ message: "Acces interdit" }, { status: 403 }) };
  }

  return { auth, response: null };
}

async function ensureTargetUserIsInScope(utilisateurId: number, currentUserId: number) {
  const target = await prisma.utilisateur.findUnique({
    where: { id: utilisateurId },
    select: {
      id: true,
      compteAgent: {
        select: {
          agentId: true,
        },
      },
    },
  });

  if (!target) {
    return { ok: false, response: NextResponse.json({ message: "Utilisateur introuvable" }, { status: 404 }) };
  }

  const agentId = target.compteAgent?.agentId ?? null;
  if (agentId == null) {
    return { ok: false, response: NextResponse.json({ message: "Utilisateur sans agent lie" }, { status: 400 }) };
  }

  const canAccess = await canAccessAgentForPermissions(currentUserId, agentId, [
    "user.update",
    "agent.read",
  ]);

  if (!canAccess) {
    return { ok: false, response: NextResponse.json({ message: "Acces interdit" }, { status: 403 }) };
  }

  return { ok: true, response: null };
}

export async function POST(req: Request) {
  const guard = await ensureRoleAssignmentAccess();
  if (guard.response) return guard.response;

  const { utilisateurId, roleId, attribuePar } = await req.json();
  const nextUtilisateurId = Number(utilisateurId);
  const nextRoleId = Number(roleId);

  if (!Number.isFinite(nextUtilisateurId) || !Number.isFinite(nextRoleId)) {
    return NextResponse.json({ message: "utilisateurId ou roleId invalide" }, { status: 400 });
  }

  const targetGuard = await ensureTargetUserIsInScope(nextUtilisateurId, guard.auth!.userId);
  if (!targetGuard.ok) return targetGuard.response;

  const role = await prisma.role.findUnique({
    where: { id: nextRoleId },
    select: { id: true, key: true, code: true, nom: true },
  });

  if (!role) {
    return NextResponse.json({ message: "Role introuvable" }, { status: 404 });
  }

  const governanceContext = await getAccessControlGovernanceContext(guard.auth!);
  if (!(await canAssignRoleFromContext(governanceContext, role))) {
    return NextResponse.json(
      { message: "Vous ne pouvez attribuer que les roles autorises dans votre espace d'administration." },
      { status: 403 }
    );
  }

  return NextResponse.json(
    await attribuerRole(nextUtilisateurId, nextRoleId, attribuePar ?? guard.auth!.userId)
  );
}

export async function DELETE(req: Request) {
  const guard = await ensureRoleAssignmentAccess();
  if (guard.response) return guard.response;

  const { utilisateurId, roleId } = await req.json();
  const nextUtilisateurId = Number(utilisateurId);
  const nextRoleId = Number(roleId);

  if (!Number.isFinite(nextUtilisateurId) || !Number.isFinite(nextRoleId)) {
    return NextResponse.json({ message: "utilisateurId ou roleId invalide" }, { status: 400 });
  }

  const targetGuard = await ensureTargetUserIsInScope(nextUtilisateurId, guard.auth!.userId);
  if (!targetGuard.ok) return targetGuard.response;

  const role = await prisma.role.findUnique({
    where: { id: nextRoleId },
    select: { id: true, key: true, code: true, nom: true },
  });

  if (!role) {
    return NextResponse.json({ message: "Role introuvable" }, { status: 404 });
  }

  const governanceContext = await getAccessControlGovernanceContext(guard.auth!);
  if (!(await canAssignRoleFromContext(governanceContext, role))) {
    return NextResponse.json(
      { message: "Vous ne pouvez retirer que les roles autorises dans votre espace d'administration." },
      { status: 403 }
    );
  }

  return NextResponse.json(await retirerRole(nextUtilisateurId, nextRoleId));
}
