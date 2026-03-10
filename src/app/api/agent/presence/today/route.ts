
// gabriel code

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { NextResponse } from "next/server";
import {
  getHoraireContextForUtilisateur,
  getTodayHoraireForUtilisateur,
} from "@/server/horaireAgent";

export const GET = async () => {

    const utilisateur = await getAuthenticatedUser()
    if (!utilisateur) {
        throw new Error("no authorize");
    }

    const horaireContext = await getHoraireContextForUtilisateur(utilisateur.userId);
    if (!horaireContext) {
        return NextResponse.json({
            working: false,
            canCheckIn: false,
            canCheckOut: false,
            getData: null,
            schedule: null,
            message: "Aucun horaire de travail actif n'est configure pour aujourd'hui.",
        });
    }

    const schedule = horaireContext.activeSchedule;
    if (!schedule) {
        const currentRange = horaireContext.currentRangeSchedule;
        const nextSchedule = horaireContext.nextSchedule;

        if (currentRange) {
            return NextResponse.json({
                working: false,
                canCheckIn: false,
                canCheckOut: false,
                getData: null,
                schedule: {
                    nomHoraire: currentRange.horaire.nomHoraire,
                    heureDebut: currentRange.startLabel,
                    heureFin: currentRange.endLabel,
                    jours: currentRange.daysLabel,
                    plage: currentRange.rangeLabel,
                    configurePar: currentRange.creatorLabel,
                },
                message: `Jour off aujourd'hui. Configuration d'horaire faite par ${currentRange.creatorLabel}, ${currentRange.rangeLabel}, jours ${currentRange.daysLabel}, heures ${currentRange.startLabel} a ${currentRange.endLabel}.`,
            });
        }

        if (nextSchedule) {
            return NextResponse.json({
                working: false,
                canCheckIn: false,
                canCheckOut: false,
                getData: null,
                schedule: {
                    nomHoraire: nextSchedule.horaire.nomHoraire,
                    heureDebut: nextSchedule.startLabel,
                    heureFin: nextSchedule.endLabel,
                    jours: nextSchedule.daysLabel,
                    plage: nextSchedule.rangeLabel,
                    configurePar: nextSchedule.creatorLabel,
                },
                message: `Jour off aujourd'hui. Nouvelle configuration d'horaire faite par ${nextSchedule.creatorLabel}, ${nextSchedule.rangeLabel}, jours ${nextSchedule.daysLabel}, heures ${nextSchedule.startLabel} a ${nextSchedule.endLabel}.`,
            });
        }

        return NextResponse.json({
            working: false,
            canCheckIn: false,
            canCheckOut: false,
            getData: null,
            schedule: null,
            message: "Jour off aujourd'hui. Aucun horaire de travail actif n'est configure pour cette date.",
        });
    }

    const todayDay = horaireContext.todayDate

    let getData = await prisma.presence.findUnique({
        where: {
            agentId_date: {
                date: todayDay,
                agentId: schedule.agentId
            }
        }
    })
    console.log(getData, "inside here api/agent/presence/today", todayDay)

    if (!getData && schedule.isAfterSchedule) {
        getData = await prisma.presence.create({
            data: {
                agentId: schedule.agentId,
                date: todayDay,
                statut: "ABSENT",
                heureArrivee: null
            }
        })
    }

    const canCheckOut = Boolean(getData?.heureArrivee) && !Boolean(getData?.heureDepart);
    const message = schedule.isWithinSchedule
        ? `Configuration d'horaire faite par ${schedule.creatorLabel}, ${schedule.rangeLabel}, jours ${schedule.daysLabel}, heures ${schedule.startLabel} a ${schedule.endLabel}.`
        : `Configuration d'horaire faite par ${schedule.creatorLabel}, ${schedule.rangeLabel}, jours ${schedule.daysLabel}, heures ${schedule.startLabel} a ${schedule.endLabel}. Le pointage est ferme pour cette plage maintenant.`;

    return NextResponse.json({
        getData,
        working: schedule.isWithinSchedule,
        canCheckIn: schedule.isWithinSchedule && !getData?.heureArrivee,
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
