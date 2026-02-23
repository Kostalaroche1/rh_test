import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/security/auth"
import { attribuerRole } from "@/app/application/utilisateur/utilsateurRole/attribuerRole"
import { retirerRole } from "@/app/application/utilisateur/utilsateurRole/retirerRole"

export async function POST(req: Request) {
    const auth = getAuthenticatedUser()
    if (!auth) {
        return NextResponse.json({ message: "Non authentifié" }, { status: 401 })
    }
    const { utilisateurId, roleId, attribuePar } = await req.json()
    return NextResponse.json(await attribuerRole(utilisateurId, roleId, attribuePar))
}

export async function DELETE(req: Request) {
    const auth = getAuthenticatedUser()
    if (!auth) {
        return NextResponse.json({ message: "Non authentifié" }, { status: 401 })
    }
    const { utilisateurId, roleId } = await req.json()
    return NextResponse.json(await retirerRole(utilisateurId, roleId))
}
