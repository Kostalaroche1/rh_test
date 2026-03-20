import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import { getAccessibleAgentIdsForPermissions } from "@/server/access/scope";

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non autorise" }, { status: 401 });
  }

  try {
    await requireAccess({
      permissions: ["demande_conge.read", "demande_conge.confirm", "demande_conge.validate"],
    });
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const accessibleAgentIds = await getAccessibleAgentIdsForPermissions(auth.userId, [
    "demande_conge.read",
    "demande_conge.confirm",
    "demande_conge.validate",
  ]);

  const getData = await prisma.demandeConge.findMany({
    where:
      accessibleAgentIds === null
        ? undefined
        : {
            agentId: {
              in: accessibleAgentIds.length ? accessibleAgentIds : [-1],
            },
          },
    include: {
      typeConge: true,
      agent: true,
    },
    orderBy: [{ dateDemande: "desc" }, { id: "desc" }],
  });

  return NextResponse.json({ status: 200, getData }, { status: 200 });
}

