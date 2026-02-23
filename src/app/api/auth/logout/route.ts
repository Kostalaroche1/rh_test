import { NextResponse } from "next/server"

export async function POST() {
    const response = NextResponse.json({ message: "Déconnecté" })
    console.log(response , "Deconnexion cookies")
    response.cookies.delete("auth_token")
    return response
}
