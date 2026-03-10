
// gabriel code 

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { NextResponse } from "next/server";


export const GET = async () => {

    const utilisateur = await getAuthenticatedUser()
    if (!utilisateur) {
        throw new Error("no authorize");
    }

    const getData = await prisma.presence.findMany({
        include: {
            agent: true,
            confirmePar: true
        }
    })

    return NextResponse.json({ status: 200, rest: "GET", getData }, { status: 200 })
}
