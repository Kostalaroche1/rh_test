import prisma from "@/lib/prisma";
import type { Presence, StatutPresence } from "@/generated/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { NextResponse } from "next/server";
import { getPresenceDayContextForUtilisateur } from "@/server/horaireAgent";
import { requireAccess } from "@/security/authorization";

async function syncPresenceStatusForDay(input: {
  presence: Presence | null;
  agentId: number;
  todayDay: Date;
  statut: Extract<StatutPresence, "CONGE" | "OFF" | "ABSENT">;
}) {
  const { presence, agentId, todayDay, statut } = input;

  if (!presence) {
    return prisma.presence.create({
      data: {
        agentId,
        date: todayDay,
        statut,
        statutWorkflow: "VALIDE",
        heureArrivee: null,
        heureDepart: null,
      },
    });
  }

  if (presence.statut === statut) {
    return presence;
  }

  if (["CONGE", "OFF", "ABSENT", "PRESENCE", "RETARD"].includes(presence.statut)) {
    return prisma.presence.update({
      where: { id: presence.id },
      data: {
        statut,
        statutWorkflow: "VALIDE",
        heureArrivee: statut === "ABSENT" ? null : presence.heureArrivee,
        heureDepart: statut === "ABSENT" ? null : presence.heureDepart,
      },
    });
  }

  return presence;
}

function latestPointageFromPresence(presence: Presence | null) {
  if (!presence) return null;
  if (presence.heureDepart) {
    return {
      id: `${presence.id}-DEPART`,
      date: presence.date,
      type: "DEPART" as const,
      heurePointage: presence.heureDepart.toISOString(),
      source: "BIOMETRIE",
    };
  }

  if (presence.heureArrivee) {
    return {
      id: `${presence.id}-ARRIVEE`,
      date: presence.date,
      type: "ARRIVEE" as const,
      heurePointage: presence.heureArrivee.toISOString(),
      source: "BIOMETRIE",
    };
  }

  return null;
}

export const GET = async () => {
  const utilisateur = await getAuthenticatedUser();
  if (!utilisateur) {
    throw new Error("no authorize");
  }

  try {
    await requireAccess({
      permissions: ["presence.read", "presence.sign"],
    });
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const dayContext = await getPresenceDayContextForUtilisateur(utilisateur.userId);
  if (!dayContext) {
    return NextResponse.json({
      working: false,
      canCheckIn: false,
      canCheckOut: false,
      getData: null,
      schedule: null,
      message: "Aucun horaire de travail actif n'est configure pour aujourd'hui.",
    });
  }

  const todayDay = dayContext.todayDate;

  let getData = await prisma.presence.findFirst({
    where: {
      agentId: dayContext.agentId,
      date: todayDay,
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
  });

  let latestPointage = latestPointageFromPresence(getData);
  if (!latestPointage) {
    const latestPresenceWithPointage = await prisma.presence.findFirst({
      where: {
        agentId: dayContext.agentId,
        OR: [{ heureArrivee: { not: null } }, { heureDepart: { not: null } }],
      },
      orderBy: [{ date: "desc" }, { updatedAt: "desc" }, { id: "desc" }],
    });
    latestPointage = latestPointageFromPresence(latestPresenceWithPointage);
  }

  if (dayContext.state === "CONGE") {
    getData = await syncPresenceStatusForDay({
      presence: getData,
      agentId: dayContext.agentId,
      todayDay,
      statut: "CONGE",
    });
  }

  if (dayContext.state === "HOLIDAY") {
    getData = await syncPresenceStatusForDay({
      presence: getData,
      agentId: dayContext.agentId,
      todayDay,
      statut: "OFF",
    });
  }

  if (dayContext.state === "OFF") {
    getData = await syncPresenceStatusForDay({
      presence: getData,
      agentId: dayContext.agentId,
      todayDay,
      statut: "OFF",
    });
  }

  if (dayContext.state === "WORKING" && dayContext.schedule.isAfterSchedule) {
    const hasAnyArrival = await prisma.presence.findFirst({
      where: {
        agentId: dayContext.agentId,
        date: todayDay,
        heureArrivee: { not: null },
      },
      select: { id: true },
    });

    if (!hasAnyArrival) {
      getData = await syncPresenceStatusForDay({
        presence: getData,
        agentId: dayContext.agentId,
        todayDay,
        statut: "ABSENT",
      });
    }
  }

  const latestOpenRow = await prisma.presence.findFirst({
    where: {
      agentId: dayContext.agentId,
      date: todayDay,
      heureArrivee: { not: null },
      heureDepart: null,
      statut: { notIn: ["CONGE", "OFF", "ABSENT"] },
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: { id: true },
  });

  const canCheckOut = dayContext.state === "WORKING" && Boolean(latestOpenRow);
  const canCheckIn =
    dayContext.state === "WORKING" &&
    dayContext.schedule.isWithinSchedule &&
    !Boolean(latestOpenRow) &&
    !["CONGE", "OFF", "ABSENT"].includes(String(getData?.statut ?? "").toUpperCase());

  if (dayContext.state === "CONGE") {
    return NextResponse.json({
      getData,
      latestPointage,
      working: false,
      canCheckIn: false,
      canCheckOut: false,
      schedule: null,
      message: `Vous etes en conge aujourd'hui. Type: ${dayContext.conge?.typeConge?.libelle ?? dayContext.conge?.typeConge?.code ?? "--"}. Impossible de marquer absent, retard ou off.`,
    });
  }

  if (dayContext.state === "HOLIDAY") {
    const holiday = dayContext.holiday;
    return NextResponse.json({
      getData,
      latestPointage,
      displayStatut: "JOUR_FERIE",
      working: false,
      canCheckIn: false,
      canCheckOut: false,
      schedule: null,
      message: `Jour ferie aujourd'hui: ${holiday?.titre ?? "Jour ferie"}. Aucun pointage de presence n'est autorise.`,
    });
  }

  if (dayContext.state === "OFF") {
    const schedule = dayContext.schedule;
    return NextResponse.json({
      getData,
      latestPointage,
      displayStatut: "OFF",
      working: false,
      canCheckIn: false,
      canCheckOut: false,
      schedule: schedule
        ? {
            nomHoraire: schedule.horaire.nomHoraire,
            heureDebut: schedule.startLabel,
            heureFin: schedule.endLabel,
            jours: schedule.daysLabel,
            plage: schedule.rangeLabel,
            configurePar: schedule.creatorLabel,
          }
        : null,
      message: schedule
        ? `Jour off aujourd'hui. Configuration d'horaire faite par ${schedule.creatorLabel}, ${schedule.rangeLabel}, jours ${schedule.daysLabel}, heures ${schedule.startLabel} a ${schedule.endLabel}.`
        : "Jour off aujourd'hui.",
    });
  }

  if (dayContext.state === "NO_SCHEDULE") {
    const nextSchedule = dayContext.schedule;
    return NextResponse.json({
      getData,
      latestPointage,
      displayStatut: "OFF",
      working: false,
      canCheckIn: false,
      canCheckOut: false,
      schedule: nextSchedule
        ? {
            nomHoraire: nextSchedule.horaire.nomHoraire,
            heureDebut: nextSchedule.startLabel,
            heureFin: nextSchedule.endLabel,
            jours: nextSchedule.daysLabel,
            plage: nextSchedule.rangeLabel,
            configurePar: nextSchedule.creatorLabel,
          }
        : null,
      message: nextSchedule
        ? `Jour off aujourd'hui. Nouvelle configuration d'horaire faite par ${nextSchedule.creatorLabel}, ${nextSchedule.rangeLabel}, jours ${nextSchedule.daysLabel}, heures ${nextSchedule.startLabel} a ${nextSchedule.endLabel}.`
        : "Jour off aujourd'hui. Aucun horaire de travail actif n'est configure pour cette date.",
    });
  }

  const schedule = dayContext.schedule;
  const message = schedule.isWithinSchedule
    ? `Configuration d'horaire faite par ${schedule.creatorLabel}, ${schedule.rangeLabel}, jours ${schedule.daysLabel}, heures ${schedule.startLabel} a ${schedule.endLabel}.`
    : `Configuration d'horaire faite par ${schedule.creatorLabel}, ${schedule.rangeLabel}, jours ${schedule.daysLabel}, heures ${schedule.startLabel} a ${schedule.endLabel}. Le pointage est ferme pour cette plage maintenant.`;

  return NextResponse.json({
    getData,
    latestPointage,
    displayStatut: getData?.statut ?? null,
    working: schedule.isWithinSchedule,
    canCheckIn,
    canCheckOut,
    schedule: {
      nomHoraire: schedule.horaire.nomHoraire,
      heureDebut: schedule.startLabel,
      heureFin: schedule.endLabel,
      jours: schedule.daysLabel,
      plage: schedule.rangeLabel,
      configurePar: schedule.creatorLabel,
    },
    message,
  });
};
