import { NextResponse } from "next/server"
import { historiqueAgentRepository } from "@/repositories/historiqueAgentRepository"
import { getAuthenticatedUser } from "@/security/auth"
import { requireAccess } from "@/security/authorization"
import { canAccessAgentForPermissions } from "@/server/access/scope"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const agentId = Number(searchParams.get("agentId"))
  const auth = await getAuthenticatedUser()

  if (!auth) {
    return NextResponse.json({ message: "Non authentifie" }, { status: 401 })
  }

  if (!agentId) {
    return NextResponse.json({ message: "agentId requis" }, { status: 400 })
  }

  try {
    await requireAccess({ permissions: ["agent.read", "affectation.read"] })
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 })
  }

  const allowed = await canAccessAgentForPermissions(auth.userId, agentId, [
    "agent.read",
    "affectation.read",
  ])

  if (!allowed) {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 })
  }

  return NextResponse.json(await historiqueAgentRepository.findByAgent(agentId))
}
