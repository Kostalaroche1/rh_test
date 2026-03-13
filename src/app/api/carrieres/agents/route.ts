import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import { getChefDepartementIds } from "@/server/access/context";

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

    const departementIds = await getChefDepartementIds(user);

    const employes = await prisma.agent.findMany({
      where:
        departementIds.length > 0
          ? {
              affectations: {
                some: {
                  departementId: { in: departementIds },
                  OR: [{ dateFin: null }, { dateFin: { gte: new Date() } }],
                },
              },
            }
          : undefined,
      select: {
        nom: true,
        prenom: true,
        statut: true,
        affectations: {
          where:
            departementIds.length > 0
              ? {
                  departementId: { in: departementIds },
                }
              : undefined,
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

