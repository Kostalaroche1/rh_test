import prisma from "@/lib/prisma"
import { getAuthenticatedUser } from "@/security/auth"
import { NextResponse } from "next/server"
import { getActiveCongeForAgent } from "@/server/horaireAgent"
import { requireAccess } from "@/security/authorization"

export const POST = async (req: Request) => {
  const body = await req.json()
  const utilisateur = await getAuthenticatedUser()

  if (!utilisateur) {
    throw new Error("Non autorise")
  }

  try {
    await requireAccess({
      permissions: ["presence.signal_absence"],
    })
  } catch {
    return NextResponse.json({ status: 403, message: "Acces interdit" }, { status: 403 })
  }

  if (!body.agentId) {
    return NextResponse.json({
      status: 404,
      message: "Agent non trouve.",
    })
  }

  const isAffect = await prisma.affectation.findFirst({
    where: {
      agentId: body.agentId,
    },
  })

  if (!isAffect) {
    return NextResponse.json({
      status: 404,
      message:
        "Cet agent n'est pas encore affecte a un service, veuillez signaler a la direction ou a l'administration.",
    })
  }

  const today = new Date()
  const todayDay = new Date(today.toISOString().split("T")[0])
  const activeConge = await getActiveCongeForAgent(body.agentId, todayDay)

  if (activeConge) {
    return NextResponse.json(
      {
        status: 400,
        message: "Cet agent est en conge aujourd'hui. Impossible de le marquer absent.",
      },
      { status: 400 }
    )
  }

  const existingPresence = await prisma.presence.findFirst({
    where: {
      agentId: body.agentId,
      date: todayDay,
    },
  })

  if (existingPresence) {
    if (existingPresence.statut === "CONGE") {
      return NextResponse.json(
        {
          status: 400,
          message: "Cet agent est en conge aujourd'hui. Impossible de le marquer absent.",
        },
        { status: 400 }
      )
    }

    if (existingPresence.statut === "OFF") {
      return NextResponse.json(
        {
          status: 400,
          message: "Cet agent est en jour off aujourd'hui. Impossible de le marquer absent.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      status: 400,
      message: `Une presence existe deja aujourd'hui avec le statut ${existingPresence.statut}.`,
    })
  }

  const absence = await prisma.presence.create({
    data: {
      agentId: body.agentId,
      date: todayDay,
      statut: "ABSENT",
      heureArrivee: null,
    },
  })

  return NextResponse.json({
    status: 200,
    message: "Absence signalee avec succes.",
    data: absence,
  })
}

export const DELETE = async (req: Request) => {
  const body = await req.json()
  const utilisateur = await getAuthenticatedUser()

  if (!utilisateur) {
    throw new Error("Non autorise")
  }

  try {
    await requireAccess({
      permissions: ["presence.signal_absence"],
    })
  } catch {
    return NextResponse.json({ status: 403, message: "Acces interdit" }, { status: 403 })
  }

  if (!body.agentId) {
    return NextResponse.json({
      status: 404,
      message: "Agent non trouve.",
    })
  }

  const today = new Date()
  const todayDay = new Date(today.toISOString().split("T")[0])

  const isAffect = await prisma.affectation.findFirst({
    where: {
      agentId: body.agentId,
    },
  })

  if (!isAffect) {
    return NextResponse.json({
      status: 404,
      message:
        "Cet agent n'est pas encore affecte a un service, veuillez signaler a la direction ou a l'administration.",
    })
  }

  const existingPresence = await prisma.presence.findFirst({
    where: {
      agentId: body.agentId,
      date: todayDay,
      statut: "ABSENT",
    },
  })

  if (!existingPresence) {
    return NextResponse.json({
      status: 404,
      message: "Il n'est pas absent aujourd'hui.",
    })
  }

  const absence = await prisma.presence.delete({
    where: {
      id: existingPresence.id,
      agentId: body.agentId,
      date: todayDay,
      statut: "ABSENT",
      heureArrivee: null,
    },
  })

  return NextResponse.json({
    status: 200,
    message: "Annulation absence reussie avec succes.",
    data: absence,
  })
}

