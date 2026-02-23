import { NextResponse } from "next/server"
import { historiqueAgentRepository } from "@/repositories/historiqueAgentRepository"
import { getAuthenticatedUser } from "@/security/auth"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const agentId = Number(searchParams.get("agentId"))
    const auth = getAuthenticatedUser()
    if (!auth) {
        return NextResponse.json({ message: "Non authentifié" }, { status: 401 })
    }
    if (!agentId) {
        return NextResponse.json({ message: "agentId requis" }, { status: 400 })
    }

    return NextResponse.json(await historiqueAgentRepository.findByAgent(agentId))
}
