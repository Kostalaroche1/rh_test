"use server"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

const JWT_SECRET = process.env.JWT_SECRET!

export async function getAuthenticatedUser() {
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) return null

    try {
        console.log(token)
        return jwt.verify(token, JWT_SECRET) 
    } catch {
        return null
    }
}
