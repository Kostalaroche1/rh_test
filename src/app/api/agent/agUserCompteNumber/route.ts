import prisma from "@/lib/prisma"
import { getAuthenticatedUser } from "@/security/auth"
import { requireAccess } from "@/security/authorization"
import { NextResponse } from "next/server"
import { getAccessibleAgentIdsForPermissions } from "@/server/access/scope"

export async function GET() {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json({ status: 401, message: "Non autorise" }, { status: 401 })
    }

    try {
      await requireAccess({ permissions: ["agent.read", "user.read"] })
    } catch {
      return NextResponse.json({ status: 403, message: "Acces refuse" }, { status: 403 })
    }

    const accessibleAgentIds = await getAccessibleAgentIdsForPermissions(auth.userId, [
      "agent.read",
      "user.read",
    ])

    const scopedAgentIds =
      accessibleAgentIds === null
        ? null
        : accessibleAgentIds.length
          ? accessibleAgentIds
          : [-1]

    const [nbreCompte, nbreUsers, nbreAgent] = await prisma.$transaction([
      prisma.compteAgent.count({
        where:
          scopedAgentIds === null
            ? undefined
            : {
                agentId: { in: scopedAgentIds },
              },
      }),
      prisma.utilisateur.count({
        where:
          scopedAgentIds === null
            ? undefined
            : {
                compteAgent: {
                  agentId: { in: scopedAgentIds },
                },
              },
      }),
      prisma.agent.count({
        where:
          scopedAgentIds === null
            ? undefined
            : {
                id: { in: scopedAgentIds },
              },
      }),
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
