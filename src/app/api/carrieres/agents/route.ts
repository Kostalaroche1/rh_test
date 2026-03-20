import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import { getAccessibleAgentIdsForPermissions } from "@/server/access/scope";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    try {
      await requireAccess({
        permissions: ["agent.read", "affectation.read"],
      });
    } catch {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const accessibleAgentIds = await getAccessibleAgentIdsForPermissions(user.userId, [
      "agent.read",
      "affectation.read",
    ]);

    const employes = await prisma.agent.findMany({
      where:
        accessibleAgentIds === null
          ? undefined
          : accessibleAgentIds.length > 0
          ? {
              id: { in: accessibleAgentIds },
            }
          : { id: -1 },
      select: {
        nom: true,
        prenom: true,
        statut: true,
        affectations: {
          select: {
            poste: {
              select: {
                libelle: true,
              },
            },
          },
          take: 1,
          orderBy: { dateDebut: "desc" },
        },
        _count: {
          select: {
            demandeConge: {
              where: {
                statut: "VALIDE",
              },
            },
          },
        },
      },
    });

    const result = employes.map((e) => ({
      nom: `${e.nom} ${e.prenom}`,
      poste: e.affectations[0]?.poste?.libelle || "Non defini",
      statut: e.statut,
      conges: e._count.demandeConge,
    }));

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible de recuperer les employes" },
      { status: 500 }
    );
  }
}

