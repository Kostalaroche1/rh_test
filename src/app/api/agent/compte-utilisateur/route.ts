import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/security/auth"
import { listerComptesAgent } from "@/app/application/agent/compteAgent/listerCompteAgent"
import { lierCompte } from "@/app/application/agent/compteAgent/lierCompte"

export async function GET() {
    const auth = await getAuthenticatedUser()
    if (!auth) {
        return NextResponse.json({ message: "Non authentifié" }, { status: 401 })
    }
    const liste = await listerComptesAgent()
    return NextResponse.json({data : liste})
}

export async function POST(req: Request) {
    const auth = getAuthenticatedUser()
    if (!auth) {
        return NextResponse.json({ message: "Non authentifié" }, { status: 401 })
    }
    const { agentId, utilisateurId, liePar } = await req.json()
    return NextResponse.json(await lierCompte(agentId, utilisateurId, liePar))
}
