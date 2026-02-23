

import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthenticatedUser } from "@/security/auth"


export const POST = async (req: Request) => {
  const data = await req.json()
  const { todayDate } = data // heure envoyée (ex: "2026-02-18T07:45:00")

  const utilisateur = await getAuthenticatedUser()
  if (!utilisateur) {
    throw new Error("no authorize")
  }

  // Date du jour (sans heure)
  const today = new Date()
  const todayDay = new Date(today.toISOString().split("T")[0])

  // Heure d'arrivée envoyée
  const heureArrivee = new Date(todayDate)
   const isPresent = await prisma.presence.findFirst({
    where: {
      agentId: utilisateur.userId,
      date: todayDay
    }
  })

  if(isPresent){
     return NextResponse.json({
    status: 200,
    message: 'vous avez déjà une présence signée'
  })
  }

  // Heure limite 07h30
  const heureLimite = new Date(todayDay)
  heureLimite.setHours(7, 30, 0, 0)

  // Détermination du statut
  let statut = "PRESENT"
  if (heureArrivee > heureLimite) {
    statut = "RETARD"
  }

  const result = await prisma.presence.create({
    data: {
      heureArrivee: heureArrivee,
      agentId: utilisateur.userId,
      statut: statut,
      date: todayDay
    }
  })

   return NextResponse.json({
    status: 200,
    message: ' présence signée avec success'
  })
}


export const PUT = async (req: Request) => {

    const data = await req.json()
    const { todayDate, id, role } = data

    const upDate = new Date()

    const utilisateur = await getAuthenticatedUser()
    console.log(utilisateur, "utilisateur from  cookie side in PUT rest to api/agent/presence", data,
        "sigle data from data")

    if (!utilisateur) {
        throw new Error("vous n'etes pas autorisé")
    }
    const userPresence = await prisma.presence.findUnique({
        where: { id: id, date: todayDate }
    })
  

  if(userPresence){
     return NextResponse.json({
    status: 200,
    message: 'vous avez déjà une présence signée'
  })
  }
    const result = await prisma.presence.update({
            where: {
                id: id
            },
            data: {
                heureDepart: todayDate,
                updatedAt: upDate
            }
        })

    return NextResponse.json({ status: 500, rest: "PUT" })
}

export const GET = async () => {

    const utilisateur = await getAuthenticatedUser()
    if (!utilisateur) {
        throw new Error("no authorize");
    }

    const getData = await prisma.presence.findMany({
        include: {
            agent: true,

        }
    })

    return NextResponse.json({ status: 500, rest: "GET", getData })
}

export const DELETE = async (req: Request) => {

    const data = await req.json()
    const { id } = data
    const utilisateur = await getAuthenticatedUser()
    console.log(utilisateur, "utilisateur from  cookie side in DELETE rest to api/agent/conge", data, "sigle data from data", id)

    // if (!utilisateur) {
    //     throw new Error(" pas vous n'etes pas autorisé")
    // }
    // try {
    //     const result = await prisma.typeConge.delete({
    //         where: {
    //             id: id
    //         }
    //     })
    //     console.log(result, "result from database")

    //     return NextResponse.json({ status: 200 })
    // } catch (error) {
    //     console.log(error, "error catch")
    //     return NextResponse.json({ status: 500 })
    // }
    return NextResponse.json({ status: 500, rest: "DELETE" })
}