// habacuk code


import prisma from "@/lib/prisma"
import { getAuthenticatedUser } from "@/security/auth"
import { NextResponse } from "next/server"

export const POST = async (req: Request) => {
  const body = await req.json()
  const utilisateur = await getAuthenticatedUser()

  if (!utilisateur) {
    throw new Error("Non autorisé")
  }

  if (!body.agentId) {
    return NextResponse.json({
      status: 404,
      message: "Agent non trouvé."
    })
  }

  const IsAffect = await prisma.affectation.findFirst({
    where: {
      agentId: body.agentId,
    }
  })

  if (!IsAffect) {
    return NextResponse.json({
      status: 404,
      message: "cet Agent n'est pas encore affecté à un service , veuillez signaler à la direction ou à l'administration."
    })
  }
  // Date du jour sans heure
  const today = new Date()
  const todayDay = new Date(today.toISOString().split("T")[0])

  // Vérifier si une présence existe déjà aujourd'hui
  const existingPresence = await prisma.presence.findFirst({
    where: {
      agentId: body.agentId,
      date: todayDay
    }
  })

  if (existingPresence) {
    return NextResponse.json({
      status: 404,
      message: "Vous avez déjà signalé votre présence aujourd'hui."
    })
  }

  // Créer une absence
  const absence = await prisma.presence.create({
    data: {
      agentId: body.agentId,
      date: todayDay,
      statut: "ABSENT",
      heureArrivee: null
    }
  })

  return NextResponse.json({
    status: 200,
    message: "Absence signalée avec succès.",
    data: absence
  })
}

export const DELETE = async (req: Request) => {
  const body = await req.json()
  const utilisateur = await getAuthenticatedUser()

  if (!utilisateur) {
    throw new Error("Non autorisé")
  }

  console.log(body, "AGENT ABSENT")

  if (!body.agentId) {
    return NextResponse.json({
      status: 404,
      message: "Agent non trouvé."
    })
  }

  // Date du jour sans heure
  const today = new Date()
  const todayDay = new Date(today.toISOString().split("T")[0])

  // Vérifier si une présence existe déjà aujourd'hui
  const IsAffect = await prisma.affectation.findFirst({
    where: {
      agentId: body.agentId,
    }
  })

  if (!IsAffect) {
    return NextResponse.json({
      status: 404,
      message: "cet Agent n'est pas encore affecté à un service , veuillez signaler à la direction ou à l'administration."
    })
  }

  const existingPresence = await prisma.presence.findFirst({
    where: {
      agentId: body.agentId,
      date: todayDay,
      statut: 'ABSENT'
    }
  })

  if (!existingPresence) {
    return NextResponse.json({
      status: 404,
      message: "Il n'est pas absent aujourd'hui."
    })
  }

  // Créer une absence
  const absence = await prisma.presence.delete({
    where: {
      id: existingPresence.id,
      agentId: body.agentId,
      date: todayDay,
      statut: "ABSENT",
      heureArrivee: null
    }
  })

  return NextResponse.json({
    status: 200,
    message: "Annulation Absence réussit avec succès.",
    data: absence
  })
}
