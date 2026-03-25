import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { modifierAgent } from "@/app/application/agent/modifierAgent";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import { generateMatricule } from "@/services/generateMat";
import { canAccessAgentForPermissions, getAccessibleAgentIdsForPermissions } from "@/server/access/scope";

async function ensureAgentAccess(permission: string | string[]) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { response: NextResponse.json({ message: "Non authentifie" }, { status: 401 }) };
  }

  try {
    const permissions = Array.isArray(permission) ? permission : [permission];
    await requireAccess({
      permissions,
    });
  } catch {
    return { response: NextResponse.json({ message: "Acces interdit" }, { status: 403 }) };
  }

  return { response: null };
}

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non authentifie" }, { status: 401 });
  }

  const guard = await ensureAgentAccess(["agent.read", "agent_dossier.read"]);
  if (guard.response) return guard.response;

  const accessibleAgentIds = await getAccessibleAgentIdsForPermissions(auth.userId, [
    "agent.read",
    "agent_dossier.read",
  ]);

  const where =
    accessibleAgentIds === null
      ? undefined
      : {
          compteAgent: {
            is: {
              agentId: {
                in: accessibleAgentIds.length ? accessibleAgentIds : [-1],
              },
            },
          },
        };

  const datas = await prisma.utilisateur.findMany({
    where,
    select: {
      id: true,
      login: true,
      actif: true,
      roles: true,
      compteAgent: {
        select: {
          agent: true,
          agentId: true,
          liePar: true,
          utilisateurId: true,
          id: true,
          dateLiaison: true,
        },
      },
    },
  });

  return NextResponse.json({ status: 200, data: datas }, { status: 200 });
}

export async function POST(req: Request) {
  const guard = await ensureAgentAccess("agent.create");
  if (guard.response) return guard.response;

  try {
    const data = await req.json();
    await prisma.agent.create({
      data: {
        matricule: generateMatricule(),
        nom: `${data.nom ?? ""} ${data.postnom ?? ""}`.trim(),
        prenom: data.prenom,
        statut: data.statut,
        dateEntree: new Date(data.dateEntree),
      },
    });

    return NextResponse.json(
      { status: 200, message: "Agent ajoute avec succes" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: 500, error, message: "Agent non ajoute" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non authentifie" }, { status: 401 });
  }

  const guard = await ensureAgentAccess("agent.update");
  if (guard.response) return guard.response;

  const data = await req.json();
  const targetAgentId = Number(data.agentId);

  if (!(await canAccessAgentForPermissions(auth.userId, targetAgentId, ["agent.update"]))) {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  await prisma.agent.update({
    where: { id: targetAgentId },
    data: {
      nom: data.nom,
      prenom: data.prenom,
      statut: data.statut,
    },
  });

  const utilisateurRole = await prisma.utilisateurRole.findFirst({
    where: { utilisateurId: Number(data.utilisateurId) },
  });

  if (utilisateurRole && data?.roleId != null) {
    await prisma.utilisateurRole.update({
      where: { id: utilisateurRole.id },
      data: { roleId: Number(data.roleId) },
    });
  }

  return NextResponse.json({ status: 200 }, { status: 200 });
}

export async function DELETE(req: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non authentifie" }, { status: 401 });
  }

  const guard = await ensureAgentAccess("agent.delete");
  if (guard.response) return guard.response;

  const data = await req.json();
  const agentId = Number(data?.agentId);
  const utilisateurId = Number(data?.utilisateurId);

  if (!Number.isFinite(agentId) || !Number.isFinite(utilisateurId)) {
    return NextResponse.json({ error: "agentId ou utilisateurId manquant" }, { status: 400 });
  }

  if (!(await canAccessAgentForPermissions(auth.userId, agentId, ["agent.delete"]))) {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  await prisma.compteAgent.deleteMany({
    where: { agentId },
  });

  await prisma.agent.delete({
    where: { id: agentId },
  });

  const utilisateurRole = await prisma.utilisateurRole.findFirst({
    where: { utilisateurId },
  });

  if (utilisateurRole) {
    await prisma.utilisateurRole.delete({
      where: { id: utilisateurRole.id },
    });
  }

  await prisma.utilisateur.delete({
    where: { id: utilisateurId },
  });

  return NextResponse.json({ status: 200 }, { status: 200 });
}

