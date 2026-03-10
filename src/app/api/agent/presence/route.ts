// gabriel code

import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthenticatedUser } from "@/security/auth"
import {
  getAgentIdFromUtilisateurId,
  getTodayHoraireForUtilisateur,
} from "@/server/horaireAgent"

export const POST = async (req: Request) => {
  const data = await req.json()
  const { todayDate } = data
  const arrivee = new Date(todayDate)

  const utilisateur = await getAuthenticatedUser()
  if (!utilisateur) {
    throw new Error("no authorize")
  }

  if (Number.isNaN(arrivee.getTime())) {
    return NextResponse.json({ status: 400, message: "Date de pointage invalide" }, { status: 400 })
  }

  const schedule = await getTodayHoraireForUtilisateur(utilisateur.userId)
  if (!schedule) {
    return NextResponse.json(
      { status: 400, message: "Aucun horaire de travail actif n'est configure pour aujourd'hui." },
      { status: 400 }
    )
  }

  if (!schedule.isWithinSchedule) {
    return NextResponse.json(
      {
        status: 400,
        message: `Pointage indisponible. Votre horaire de travail aujourd'hui est de ${schedule.startLabel} a ${schedule.endLabel}.`,
      },
      { status: 400 }
    )
  }

  const existingPresence = await prisma.presence.findFirst({
    where: {
      agentId: schedule.agentId,
      date: schedule.todayDate,
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
      agentId: schedule.agentId,
      statut: "BROUILLON",
      date: schedule.todayDate,
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
      const schedule = await getTodayHoraireForUtilisateur(utilisateur.userId)
      if (!schedule) {
        return NextResponse.json(
          { status: 400, message: "Aucun horaire de travail actif n'est configure pour aujourd'hui." },
          { status: 400 }
        )
      }

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

  const agentId = await getAgentIdFromUtilisateurId(utilisateur.userId)
  if (!agentId) {
    return NextResponse.json({ status: 200, rest: "GET", getData: [] }, { status: 200 })
  }

  const getData = await prisma.presence.findMany({
    where: { agentId },
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
