import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import { hasAnyPermission } from "@/security/permissions";
import { getAccessibleAgentIdsForPermissions } from "@/server/access/scope";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    try {
      await requireAccess({
        permissions: ["agent.read", "affectation.read"],
      });
    } catch {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const currentYear = new Date().getFullYear();
    const accessibleAgentIds = await getAccessibleAgentIdsForPermissions(auth.userId, [
      "agent.read",
      "affectation.read",
    ]);

    const agents = await prisma.agent.findMany({
      where: {
        actif: true,
        datenais: {
          lte: new Date(`${currentYear - 60}-12-31`),
        },
        ...(accessibleAgentIds === null
          ? {}
          : {
              id: { in: accessibleAgentIds.length ? accessibleAgentIds : [-1] },
            }),
      },
      select: { id: true, nom: true, prenom: true, datenais: true },
    });

    const data = agents.map((agent) => ({
      ...agent,
      age: agent.datenais ? currentYear - agent.datenais.getFullYear() : null,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
