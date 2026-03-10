// gabriel code

import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthenticatedUser } from "@/security/auth"

export const POST = async (req: NextRequest) => {
  const data = await req.json()
  const { dateDebut, dateFin, dateDemande, motif, typeCongeId } = data
  console.log(data, "update demande conge")
  const utilisateur = await getAuthenticatedUser()
  console.log(
    data,
    "sigle data from data",
    dateDebut,
    dateFin,
    dateDemande,
    motif,
    typeCongeId
  )

  if (!utilisateur) {
    throw new Error("pas vous n'etes pas autorise")
  }

  try {
    const result = await prisma.demandeConge.create({
      data: {
        agentId: utilisateur.userId,
        typeCongeId: parseInt(typeCongeId),
        dateDemande: new Date(dateDemande),
        dateDebut: new Date(dateDebut),
        dateFin: new Date(dateFin),
        motif: motif,
      },
    })
    console.log(result, "result and result.ok")
    return NextResponse.json({
      status: 200,
      result,
    })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ status: 200 })
  }
}

export const PUT = async (req: NextRequest) => {
  try {
    const body = await req.json()
    const { id, dateDebut, dateFin, dateDemande, motif, statut, role, agent, typeConge } = body

    const utilisateur = await getAuthenticatedUser()
    console.log("sigle data from data", body)

    if (!utilisateur) {
      return NextResponse.json({ message: "Non autorise", status: 401 })
    }

    const demande = await prisma.demandeConge.findUnique({
      where: { id: id },
    })

    if (!demande) {
      return NextResponse.json({ message: "Demande introuvable", status: 404 })
    }

    let result

    if (role === "RH") {
      const demande = await prisma.demandeConge.findUnique({
        where: { id: id },
      })

      if (demande?.statut === "EN_ATTENTE") {
        return NextResponse.json({
          message: "La demande doit etre confirmee avant validation ",
          status: 404,
        })
      }

      result = await prisma.demandeConge.update({
        where: { id: id },
        data: {
          statut: statut,
          validePar: utilisateur.userId,
          dateValidation: new Date(),
        },
      })
    } else if (role === "chefservice") {
      result = await prisma.demandeConge.update({
        where: { id },
        data: {
          statut,
          confirmePar: utilisateur.userId,
        },
      })
    } else if (role === "agent") {
      result = await prisma.demandeConge.update({
        where: { id },
        data: {
          agent: {
            connect: { id: agent?.id },
          },
          typeConge: {
            connect: { id: typeConge?.id },
          },
          dateDemande: new Date(dateDemande),
          dateDebut: new Date(dateDebut),
          dateFin: new Date(dateFin),
          motif,
          statut,
        },
      })
      console.log("result nest PUT from prisma db", result)
    } else {
      return NextResponse.json({ message: "Role non autorise", status: 403 })
    }

    return NextResponse.json({
      status: 200,
      message: "VOus avez " + statut + "cette demande de conge",
      result,
    })
  } catch (error) {
    console.error("Erreur PUT /demandeConge :", error)

    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 })
  }
}

export const GET = async () => {
  const utilisateur = await getAuthenticatedUser()
  console.log(utilisateur, "utilisateur from  cookie side in GET rest to api/agent/conge/demande")

  if (!utilisateur) {
    throw new Error("pas vous n'etes pas autorise")
  }
  try {
    const getData = await prisma.demandeConge.findMany({
      where: {
        agentId: utilisateur.userId,
      },
      include: {
        typeConge: true,
        agent: true,
      },
    })
    return NextResponse.json({ status: 200, getData })
  } catch (error) {
    console.log(error)
    return NextResponse.json({ status: 404 })
  }
}

export const DELETE = async (req: Request) => {
  const data = await req.json()
  const { id } = data
  const utilisateur = await getAuthenticatedUser()
  console.log("utilisateur from  cookie side in DELETE rest to api/agent/conge/demande", data, id)

  if (!utilisateur) {
    throw new Error(" pas vous n'etes pas autorise")
  }
  try {
    const result = await prisma.demandeConge.delete({
      where: { id: id },
    })
    console.log(result, "result from")

    return NextResponse.json({ status: 200, result })
  } catch (error) {
    console.log(error, "error catch")
    return NextResponse.json({ status: 500 })
  }
}
