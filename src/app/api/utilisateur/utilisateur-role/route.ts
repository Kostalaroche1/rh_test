import { NextResponse } from "next/server";

import { attribuerRole } from "@/app/application/utilisateur/utilsateurRole/attribuerRole";
import { retirerRole } from "@/app/application/utilisateur/utilsateurRole/retirerRole";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";

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

export async function POST(req: Request) {
  const guard = await ensureRoleAssignmentAccess();
  if (guard.response) return guard.response;

  const { utilisateurId, roleId, attribuePar } = await req.json();
  return NextResponse.json(
    await attribuerRole(utilisateurId, roleId, attribuePar ?? guard.auth!.userId)
  );
}

export async function DELETE(req: Request) {
  const guard = await ensureRoleAssignmentAccess();
  if (guard.response) return guard.response;

  const { utilisateurId, roleId } = await req.json();
  return NextResponse.json(await retirerRole(utilisateurId, roleId));
}

