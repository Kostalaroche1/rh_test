
// gabriel code

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { NextResponse } from "next/server";

export const GET = async () => {

    const utilisateur = await getAuthenticatedUser()
    if (!utilisateur) {
        throw new Error("no authorize");
    }

    const working = isWorkingTime();
    const afterWorkEnd = isAfterWorkEnd();

    if (!working) {
        return NextResponse.json({
            working: false,
            getData: null
        });
    }


    const todayDay = new Date().toISOString().split("T")[0]

    let getData = await prisma.presence.findUnique({
        where: {
            agentId_date: {
                date: new Date(todayDay),
                agentId: utilisateur.userId
            }
        }
    })
    console.log(getData, "inside here api/agent/presence/today", todayDay)

    if (!getData && afterWorkEnd) {
        getData = await prisma.presence.create({
            data: {
                agentId: utilisateur.userId,
                date: new Date(todayDay),
                statut: "ABSENT",
                heureArrivee: null
            }
        })
    }

    return NextResponse.json({
        getData, working: true,
    })
}

function isWorkingTime() {
    const now = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Africa/Kinshasa" })
    );

    const day = now.getDay();
    if (day === 0 || day === 6) return false;

    const totalMinutes = now.getHours() * 60 + now.getMinutes();

    const start = 7 * 60 + 30
    const end = 16 * 60 + 30;

    return totalMinutes >= start && totalMinutes <= end;
}

function isAfterWorkEnd() {
    const now = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Africa/Kinshasa" })
    );

    const day = now.getDay();
    if (day === 0 || day === 6) return false;

    const totalMinutes = now.getHours() * 60 + now.getMinutes();
    const end = 16 * 60 + 30;
    return totalMinutes >= end;
}
