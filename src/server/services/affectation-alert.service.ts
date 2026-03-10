import prisma from "@/lib/prisma";
import { notifyAffectationExpiry } from "@/server/services/notification.service";

export async function emitAffectationExpiryAlerts(daysAhead = 7) {
  const now = new Date();
  const limit = new Date();
  limit.setDate(limit.getDate() + daysAhead);

  const expiring = await prisma.affectation.findMany({
    where: {
      dateFin: {
        gte: now,
        lte: limit,
      },
      statut: { not: "REJETE" },
    },
    include: {
      agent: {
        select: {
          nom: true,
          prenom: true,
          matricule: true,
        },
      },
    },
  });

  await Promise.all(
    expiring
      .filter((item) => item.dateFin)
      .map((item) =>
        notifyAffectationExpiry({
          affectationId: item.id,
          agentLabel: `${item.agent?.nom ?? ""} ${item.agent?.prenom ?? ""} (${item.agent?.matricule ?? "-"})`.trim(),
          dateFin: item.dateFin as Date,
        })
      )
  );

  return expiring.length;
}

