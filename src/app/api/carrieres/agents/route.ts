// app/api/employes/route.ts
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const employes = await prisma.agent.findMany({
      select: {
        nom: true,
        prenom: true,
        statut: true,
        affectations: {
          select: {
            poste: {
              select: {
                libelle: true
              }
            }
          },
          take: 1 // prend le poste actuel le plus récent
        },
        _count: {
          select: {
            demandeConge: {
              where: {
                statut: "VALIDE"
              }
            }
          }
        }
      }
    });

    const result = employes.map((e) => ({
      nom: `${e.nom} ${e.prenom}`,
      poste: e.affectations[0]?.poste?.libelle || "Non défini",
      statut: e.statut,
      conges: e._count.demandeConge,
    }));

    return NextResponse.json({data : result});
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Impossible de récupérer les employés" ,  status: 500 });
  }
}
