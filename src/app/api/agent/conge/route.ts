import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { data } from "@/utilities/menu_dashboard"
import { getAuthenticatedUser } from "@/security/auth"


export const POST = async (req: Request) => {
    const data = await req.json()
    const { code, libelle, dureeMax } = data
    console.log(code, libelle, dureeMax, "and data json", data)
    const utilisateur = await getAuthenticatedUser()
    if (!utilisateur) {
        throw new Error("no authorize");
    }
    try {
        const result = await prisma.typeConge.create(
            {
                data: {
                    code: code,
                    libelle: libelle,
                    dureeMax: Number(dureeMax),
                    createur: {
                        connect: {
                            id: utilisateur.userId
                        }
                    }
                }
            }
        )
        console.log(result, 'result to api/agent/')

        return NextResponse.json({ status: 200, result })

    } catch (error) {
        console.log(error, "error")
        console.log("data insie api/agent/conge")

        return NextResponse.json({ status: 200, error })

    }
}

export const PUT = async (req: Request) => {

    const data = await req.json()
    const { code, libelle, dureeMax, id } = data

    const utilisateur = await getAuthenticatedUser()
    console.log(utilisateur, "utilisateur from  cookie side in PUT rest to api/agent/conge", data,
        "sigle data from data")

    if (!utilisateur) {
        throw new Error(" pas vous n'etes pas autorisé")
    }

    try {

        const result = await prisma.typeConge.update(

            {
                where: {
                    id: id
                },
                data: {
                    code: code,
                    libelle: libelle,
                    dureeMax: parseInt(dureeMax),
                    createurId: utilisateur.userId
                }
            }
        )
        console.log(result)
        return NextResponse.json({ status: 200, result })
    } catch (error) {
        console.log(error)
        return NextResponse.json({ status: 500 })
    }
}

export const GET = async () => {
    try {
        const getData = await prisma.typeConge.findMany()
        console.log(getData, 'from database in api/agent/conge/get rest')
        return NextResponse.json({ status: 200, getData })
    } catch (error) {
        console.log(error)
        return NextResponse.json({ status: 200, error })

    }
}

export const DELETE = async (req: Request) => {

    const data = await req.json()
    const { id } = data
    const utilisateur = await getAuthenticatedUser()
    console.log(utilisateur, "utilisateur from  cookie side in DELETE rest to api/agent/conge", data, "sigle data from data", id)

    if (!utilisateur) {
        throw new Error(" pas vous n'etes pas autorisé")
    }
    try {
        const result = await prisma.typeConge.delete({
            where: {
                id: id
            }
        })
        console.log(result, "result from database")

        return NextResponse.json({ status: 200 })
    } catch (error) {
        console.log(error, "error catch")
        return NextResponse.json({ status: 500 })
    }
}