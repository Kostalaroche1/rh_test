// gabriel code

import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthenticatedUser } from "@/security/auth"

export const POST = async (req: Request) => {
  const data = await req.json()
  const { todayDate } = data
  const todayDay = new Date().toISOString().split("T")[0]
  const arrivee = new Date(todayDate)

  const utilisateur = await getAuthenticatedUser()
  if (!utilisateur) {
    throw new Error("no authorize")
  }

  if (Number.isNaN(arrivee.getTime())) {
    return NextResponse.json({ status: 400, message: "Date de pointage invalide" }, { status: 400 })
  }

  const existingPresence = await prisma.presence.findFirst({
    where: {
      agentId: utilisateur.userId,
      date: new Date(todayDay),
    },
  })

  if (existingPresence) {
    if (existingPresence.statut === "ABSENT" && !existingPresence.heureArrivee) {
      const updated = await prisma.presence.update({
        where: { id: existingPresence.id },
        data: {
          heureArrivee: arrivee,
          statut: "BROUILLON",
          updatedAt: new Date(),
        },
      })
      return NextResponse.json({ status: 200, result: updated }, { status: 200 })
    }

    return NextResponse.json(
      { status: 200, message: "Presence deja signee aujourd'hui." },
      { status: 200 }
    )
  }

  const result = await prisma.presence.create({
    data: {
      heureArrivee: arrivee,
      agentId: utilisateur.userId,
      statut: "BROUILLON",
      date: new Date(todayDay),
    },
  })

  return NextResponse.json({ status: 200, result }, { status: 200 })
}

export const PUT = async (req: Request) => {
  const data = await req.json()
  const { todayDate, id, role } = data

  const upDate = new Date()
  const depart = new Date(todayDate)

  const utilisateur = await getAuthenticatedUser()
  console.log(
    utilisateur,
    "utilisateur from  cookie side in PUT rest to api/agent/presence",
    data,
    "sigle data from data"
  )

  try {
    if (!utilisateur) {
      throw new Error(" pas vous n'etes pas autorise")
    }
    if (Number.isNaN(depart.getTime())) {
      return NextResponse.json({ status: 400, message: "Date invalide" }, { status: 400 })
    }

    let result
    if (role === "agent") {
      result = await prisma.presence.update({
        where: { id: id },
        data: {
          heureDepart: depart,
          updatedAt: upDate,
        },
      })
    }

    if (role === "chiefservice") {
      result = await prisma.presence.update({
        where: { id: id },
        data: {
          confirmePar: { connect: { id: utilisateur.userId } },
          updatedAt: upDate,
          statut: "CONFIRME",
        },
      })
    } else if (role === "RH") {
      result = await prisma.presence.update({
        where: { id: id },
        data: {
          validePar: { connect: { id: utilisateur.userId } },
          updatedAt: upDate,
          statut: "VALIDE",
        },
      })
    }
    return NextResponse.json({ status: 200, result }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ status: 500 })
  }
}

export const GET = async () => {
  const utilisateur = await getAuthenticatedUser()
  if (!utilisateur) {
    throw new Error("no authorize")
  }

  const getData = await prisma.presence.findMany({
    where: { agentId: utilisateur.userId },
    include: { agent: true },
  })

  return NextResponse.json({ status: 200, rest: "GET", getData }, { status: 200 })
}

export const DELETE = async (req: Request) => {
  const data = await req.json()
  const { id } = data
  const utilisateur = await getAuthenticatedUser()
  console.log(
    utilisateur,
    "utilisateur from  cookie side in DELETE rest to api/agent/presence",
    data,
    "sigle data from data",
    id
  )

  if (!utilisateur) {
    throw new Error(" pas vous n'etes pas autorise")
  }
  if (!id) {
    return NextResponse.json({ status: 400, message: "ID invalide" }, { status: 400 })
  }
  try {
    const result = await prisma.presence.delete({
      where: {
        id: id,
        agentId: utilisateur.userId,
      },
    })
    console.log(result, "result from database")

    return NextResponse.json({ status: 200, result }, { status: 200 })
  } catch (error) {
    console.log(error, "error catch")
    return NextResponse.json({ status: 500 })
  }
}
