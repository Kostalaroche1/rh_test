
// gabriel code

import prisma from "@/lib/prisma";
import type { Presence, StatutPresence } from "@/generated/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { NextResponse } from "next/server";
import {
  getPresenceDayContextForUtilisateur,
} from "@/server/horaireAgent";
import { requireAccess } from "@/security/authorization";

async function syncPresenceStatusForDay(input: {
    presence: Presence | null;
    agentId: number;
    todayDay: Date;
    statut: Extract<StatutPresence, "CONGE" | "OFF" | "ABSENT">;
}) {
    const { presence, agentId, todayDay, statut } = input;

    // Auto-generated day statuses are always final. They do not need the normal draft/confirm/validate workflow.
    if (!presence) {
        return prisma.presence.create({
            data: {
                agentId,
                date: todayDay,
                statut,
                statutWorkflow: "VALIDE",
                heureArrivee: null,
                heureDepart: null,
            }
        });
    }

    if (presence.statut === statut) {
        return presence;
    }

    // Reuse the same row when the system recomputes the day status to avoid duplicate presence entries.
    if (["CONGE", "OFF", "ABSENT", "PRESENCE", "RETARD"].includes(presence.statut)) {
        return prisma.presence.update({
            where: { id: presence.id },
            data: {
                statut,
                statutWorkflow: "VALIDE",
                heureArrivee: statut === "ABSENT" ? null : presence.heureArrivee,
                heureDepart: statut === "ABSENT" ? null : presence.heureDepart,
            }
        });
    }

    return presence;
}

export const GET = async () => {

    const utilisateur = await getAuthenticatedUser()
    if (!utilisateur) {
        throw new Error("no authorize");
    }

    try {
        await requireAccess({
            permissions: ["presence.read", "presence.sign"],
        })
    } catch {
        return NextResponse.json({ message: "Acces interdit" }, { status: 403 })
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

    const todayDay = dayContext.todayDate

    let getData = await prisma.presence.findUnique({
        where: {
            agentId_date: {
                date: todayDay,
                agentId: dayContext.agentId
            }
        }
    })
    console.log(getData, "inside here api/agent/presence/today", todayDay)

    if (dayContext.state === "CONGE") {
        getData = await syncPresenceStatusForDay({
            presence: getData,
            agentId: dayContext.agentId,
            todayDay,
            statut: "CONGE",
        })
    }

    if (dayContext.state === "HOLIDAY") {
        getData = await syncPresenceStatusForDay({
            presence: getData,
            agentId: dayContext.agentId,
            todayDay,
            statut: "OFF",
        })
    }

    if (dayContext.state === "OFF") {
        getData = await syncPresenceStatusForDay({
            presence: getData,
            agentId: dayContext.agentId,
            todayDay,
            statut: "OFF",
        })
    }

    // Once the work window is closed without any arrival time, the system turns the day into ABSENT automatically.
    if (dayContext.state === "WORKING" && dayContext.schedule.isAfterSchedule && !getData?.heureArrivee) {
        getData = await syncPresenceStatusForDay({
            presence: getData,
            agentId: dayContext.agentId,
            todayDay,
            statut: "ABSENT",
        })
    }

    const canCheckOut =
        dayContext.state === "WORKING" &&
        Boolean(getData?.heureArrivee) &&
        !Boolean(getData?.heureDepart) &&
        !["CONGE", "OFF", "ABSENT"].includes(String(getData?.statut ?? "").toUpperCase());

    if (dayContext.state === "CONGE") {
        return NextResponse.json({
            getData,
            working: false,
            canCheckIn: false,
            canCheckOut: false,
            schedule: null,
            message: `Vous etes en conge aujourd'hui. Type: ${dayContext.conge?.typeConge?.libelle ?? dayContext.conge?.typeConge?.code ?? "--"}. Impossible de marquer absent, retard ou off.`,
        })
    }

    if (dayContext.state === "HOLIDAY") {
        const holiday = dayContext.holiday;
        return NextResponse.json({
            getData,
            displayStatut: "JOUR_FERIE",
            working: false,
            canCheckIn: false,
            canCheckOut: false,
            schedule: null,
            message: `Jour ferie aujourd'hui: ${holiday?.titre ?? "Jour ferie"}. Aucun pointage de presence n'est autorise.`,
        })
    }

    if (dayContext.state === "OFF") {
        const schedule = dayContext.schedule;
        return NextResponse.json({
            getData,
            displayStatut: "OFF",
            working: false,
            canCheckIn: false,
            canCheckOut: false,
            schedule: schedule ? {
                nomHoraire: schedule.horaire.nomHoraire,
                heureDebut: schedule.startLabel,
                heureFin: schedule.endLabel,
                jours: schedule.daysLabel,
                plage: schedule.rangeLabel,
                configurePar: schedule.creatorLabel,
            } : null,
            message: schedule
                ? `Jour off aujourd'hui. Configuration d'horaire faite par ${schedule.creatorLabel}, ${schedule.rangeLabel}, jours ${schedule.daysLabel}, heures ${schedule.startLabel} a ${schedule.endLabel}.`
                : "Jour off aujourd'hui.",
        })
    }

    if (dayContext.state === "NO_SCHEDULE") {
        const nextSchedule = dayContext.schedule;
        return NextResponse.json({
            getData,
            displayStatut: "OFF",
            working: false,
            canCheckIn: false,
            canCheckOut: false,
            schedule: nextSchedule ? {
                nomHoraire: nextSchedule.horaire.nomHoraire,
                heureDebut: nextSchedule.startLabel,
                heureFin: nextSchedule.endLabel,
                jours: nextSchedule.daysLabel,
                plage: nextSchedule.rangeLabel,
                configurePar: nextSchedule.creatorLabel,
            } : null,
            message: nextSchedule
                ? `Jour off aujourd'hui. Nouvelle configuration d'horaire faite par ${nextSchedule.creatorLabel}, ${nextSchedule.rangeLabel}, jours ${nextSchedule.daysLabel}, heures ${nextSchedule.startLabel} a ${nextSchedule.endLabel}.`
                : "Jour off aujourd'hui. Aucun horaire de travail actif n'est configure pour cette date.",
        })
    }

    const schedule = dayContext.schedule;
    const message = schedule.isWithinSchedule
        ? `Configuration d'horaire faite par ${schedule.creatorLabel}, ${schedule.rangeLabel}, jours ${schedule.daysLabel}, heures ${schedule.startLabel} a ${schedule.endLabel}.`
        : `Configuration d'horaire faite par ${schedule.creatorLabel}, ${schedule.rangeLabel}, jours ${schedule.daysLabel}, heures ${schedule.startLabel} a ${schedule.endLabel}. Le pointage est ferme pour cette plage maintenant.`;

    return NextResponse.json({
        getData,
        displayStatut: getData?.statut ?? null,
        working: schedule.isWithinSchedule,
        canCheckIn:
            schedule.isWithinSchedule &&
            !getData?.heureArrivee &&
            !["CONGE", "OFF", "ABSENT"].includes(String(getData?.statut ?? "").toUpperCase()),
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
    })
}

