// gabriel code


import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { NextResponse } from "next/server";

export const GET = async () => {
    const utilisateur = await getAuthenticatedUser()
    console.log(utilisateur, "utilisateur from  cookie side in GET rest to api/agent/conge/demande");

    if (!utilisateur) {
        throw new Error("pas vous n'etes pas autorisé")
    }
    try {
        const getData = await prisma.demandeConge.findMany(
            {

                include: {
                    typeConge: true,
                    agent: true,
                }
            }
        )
        // console.log(getData, 'from database in api/agent/conge/demande get rest')
        return NextResponse.json({ status: 200, getData })
    } catch (error) {
        console.log(error)
        return NextResponse.json({ status: 404 })
    }
}