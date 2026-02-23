import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const [nbreCompte, nbreUsers, nbreAgent] = await prisma.$transaction([
      prisma.compteAgent.count(),
      prisma.utilisateur.count(),
      prisma.agent.count(),
    ])

    return NextResponse.json({
      status: 200,
      data: {
        nbreCompte,
        nbreUsers,
        nbreAgent,
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { status: 500, message: "Erreur serveur" },
      { status: 500 }
    )
  }
}
