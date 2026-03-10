import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { NextResponse } from "next/server";
import { getCurrentAgentId } from "@/server/access/context";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const agentId = await getCurrentAgentId(user);
    if (!agentId) {
      return NextResponse.json(
        { error: "Aucun profil agent lie a ce compte." },
        { status: 403 }
      );
    }

    const [absences, presences, conges, demandeconges] = await Promise.all([
      prisma.presence.count({ where: { agentId, statut: "ABSENT" } }),
      prisma.presence.count({
        where: {
          agentId,
          heureArrivee: { not: null },
          statut: { notIn: ["ABSENT"] },
        },
      }),
      prisma.demandeConge.findMany({ where: { agentId, statut: "VALIDE" } }),
      prisma.demandeConge.count({ where: { agentId } }),
    ]);

    let totalJoursConge = 0;
    for (const conge of conges) {
      if (conge.dateDebut && conge.dateFin) {
        const diffTime = conge.dateFin.getTime() - conge.dateDebut.getTime();
        totalJoursConge += diffTime / (1000 * 60 * 60 * 24) + 1;
      }
    }

    return NextResponse.json(
      { data: { absences, presences, conges: totalJoursConge, demandeconges } },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Impossible de recuperer les stats" },
      { status: 500 }
    );
  }
}
