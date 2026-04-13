// gabriel code

import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthenticatedUser } from "@/security/auth"
import {
  getAgentIdFromUtilisateurId,
  getPresenceDayContextForUtilisateur,
} from "@/server/horaireAgent"
import { requireAccess } from "@/security/authorization"
import { canAccessAgentForPermissions } from "@/server/access/scope"

export const POST = async (req: Request) => {
  const data = await req.json()
  const { todayDate } = data
  const arrivee = new Date(todayDate)

  const utilisateur = await getAuthenticatedUser()
  if (!utilisateur) {
    throw new Error("no authorize")
  }

  try {
    await requireAccess({
      permissions: ["presence.sign"],
    })
  } catch {
    return NextResponse.json({ status: 403, message: "Acces interdit" }, { status: 403 })
  }

  if (Number.isNaN(arrivee.getTime())) {
    return NextResponse.json({ status: 400, message: "Date de pointage invalide" }, { status: 400 })
  }

  const dayContext = await getPresenceDayContextForUtilisateur(utilisateur.userId)
  if (!dayContext) {
    return NextResponse.json(
      { status: 400, message: "Aucun horaire de travail actif n'est configure pour aujourd'hui." },
      { status: 400 }
    )
  }

  if (dayContext.state === "CONGE") {
    return NextResponse.json(
      { status: 400, message: "Vous etes en conge aujourd'hui. Aucun pointage de presence n'est autorise." },
      { status: 400 }
    )
  }

  if (dayContext.state === "HOLIDAY") {
    return NextResponse.json(
      {
        status: 400,
        message: `Jour ferie aujourd'hui: ${dayContext.holiday?.titre ?? "Jour ferie"}. Aucun pointage de presence n'est autorise.`,
      },
      { status: 400 }
    )
  }

  if (dayContext.state === "OFF") {
    return NextResponse.json(
      { status: 400, message: "Vous etes en jour off aujourd'hui. Aucun pointage de presence n'est autorise." },
      { status: 400 }
    )
  }

  if (dayContext.state !== "WORKING") {
    return NextResponse.json(
      { status: 400, message: "Aucun horaire de travail actif n'est configure pour aujourd'hui." },
      { status: 400 }
    )
  }

  const schedule = dayContext.schedule

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
      date: dayContext.todayDate,
    },
  })

  if (existingPresence) {
    if (["CONGE", "OFF", "ABSENT"].includes(existingPresence.statut)) {
      return NextResponse.json(
        { status: 400, message: `Pointage refuse. Le statut du jour est ${existingPresence.statut}.` },
        { status: 400 }
      )
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
      statut:
        arrivee.getHours() * 60 + arrivee.getMinutes() > schedule.startMinutes
          ? "RETARD"
          : "PRESENCE",
      statutWorkflow: "BROUILLON",
      date: dayContext.todayDate,
    },
  })

  return NextResponse.json({ status: 200, result }, { status: 200 })
}

export const PUT = async (req: Request) => {
  const data = await req.json()
  const { todayDate, id, action } = data
  const operation = String(action ?? "").trim()

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
    if (operation === "check_out") {
      try {
        await requireAccess({
          permissions: ["presence.update", "presence.sign"],
        })
      } catch {
        return NextResponse.json({ status: 403, message: "Acces interdit" }, { status: 403 })
      }

      const dayContext = await getPresenceDayContextForUtilisateur(utilisateur.userId)
      if (!dayContext || dayContext.state !== "WORKING") {
        return NextResponse.json(
          { status: 400, message: "Aucun horaire de travail actif n'est configure pour aujourd'hui." },
          { status: 400 }
        )
      }

      const presence = await prisma.presence.findUnique({
        where: { id: id },
      })

      if (!presence) {
        return NextResponse.json({ status: 404, message: "Presence introuvable" }, { status: 404 })
      }

      if (!(await canAccessAgentForPermissions(utilisateur.userId, presence.agentId, ["presence.update", "presence.sign"]))) {
        return NextResponse.json({ status: 403, message: "Acces interdit" }, { status: 403 })
      }

      if (["CONGE", "OFF", "ABSENT"].includes(presence.statut)) {
        return NextResponse.json(
          { status: 400, message: `Le statut ${presence.statut} ne peut pas etre transforme en depart.` },
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
    } else if (operation === "confirm") {
      try {
        await requireAccess({
          permissions: ["presence.confirm"],
        })
      } catch {
        return NextResponse.json({ status: 403, message: "Acces interdit" }, { status: 403 })
      }

      const presence = await prisma.presence.findUnique({
        where: { id },
        select: { agentId: true },
      })

      if (!presence) {
        return NextResponse.json({ status: 404, message: "Presence introuvable" }, { status: 404 })
      }

      if (!(await canAccessAgentForPermissions(utilisateur.userId, presence.agentId, ["presence.confirm"]))) {
        return NextResponse.json({ status: 403, message: "Acces interdit" }, { status: 403 })
      }

      result = await prisma.presence.update({
        where: { id: id },
        data: {
          confirmePar: { connect: { id: utilisateur.userId } },
          updatedAt: upDate,
          statutWorkflow: "CONFIRME",
        },
      })
    } else if (operation === "validate") {
      try {
        await requireAccess({
          permissions: ["presence.validate"],
        })
      } catch {
        return NextResponse.json({ status: 403, message: "Acces interdit" }, { status: 403 })
      }

      const presence = await prisma.presence.findUnique({
        where: { id },
        select: { agentId: true },
      })

      if (!presence) {
        return NextResponse.json({ status: 404, message: "Presence introuvable" }, { status: 404 })
      }

      if (!(await canAccessAgentForPermissions(utilisateur.userId, presence.agentId, ["presence.validate"]))) {
        return NextResponse.json({ status: 403, message: "Acces interdit" }, { status: 403 })
      }

      result = await prisma.presence.update({
        where: { id: id },
        data: {
          validePar: { connect: { id: utilisateur.userId } },
          updatedAt: upDate,
          statutWorkflow: "VALIDE",
        },
      })
    } else {
      return NextResponse.json({ status: 400, message: "Action de presence invalide" }, { status: 400 })
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

  try {
    await requireAccess({
      permissions: ["presence.read"],
    })
  } catch {
    return NextResponse.json({ status: 403, message: "Acces interdit" }, { status: 403 })
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

  try {
    await requireAccess({
      permissions: ["presence.delete"],
    })
  } catch {
    return NextResponse.json({ status: 403, message: "Acces interdit" }, { status: 403 })
  }
  if (!id) {
    return NextResponse.json({ status: 400, message: "ID invalide" }, { status: 400 })
  }
  try {
    const agentId = await getAgentIdFromUtilisateurId(utilisateur.userId)
    if (!agentId) {
      return NextResponse.json({ status: 400, message: "Agent introuvable" }, { status: 400 })
    }

    const result = await prisma.presence.delete({
      where: {
        id: id,
        agentId,
      },
    })
    console.log(result, "result from database")

    return NextResponse.json({ status: 200, result }, { status: 200 })
  } catch (error) {
    console.log(error, "error catch")
    return NextResponse.json({ status: 500 })
  }
}

