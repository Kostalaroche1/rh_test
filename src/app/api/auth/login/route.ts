import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { utilisateurRepository } from "@/repositories/utilisateurRepository"
import prisma from "@/lib/prisma"

const JWT_SECRET = process.env.JWT_SECRET!

export async function POST(req: Request) {
    const { login, motDePasse } = await req.json()

    const users = await utilisateurRepository.findAll()
    // console.log(users , "get users roles")
    
    const user = users.find(u => u.login === login && u.actif)
       
    if (!user) {
        return NextResponse.json({ message: "Identifiants invalides" }, { status: 401 })
    }

    const compteAgentActif = user.compteAgent?.utilisateur.actif
    const roleActif = user.roles[user.roles.length - 1]?.role.actif

    if(!compteAgentActif){
        return NextResponse.json({ message: "ce compte n'est pas actif ou a été desactivé veuillez passé chez le RH pour plus de précision" }, { status: 401 })
    }

    if(!roleActif){
        return NextResponse.json({ message: "ce compte ou role n'est pas actif ou a été desactivé veuillez passé chez le RH pour plus de précision" }, { status: 401 })
    }

    const isValid = await bcrypt.compare(motDePasse, user.motDePasse)
//  console.log(isValid , login)
    if (!isValid) {
        return NextResponse.json({ message: "mot de passe ou nom d'utilisateur incorrecte" }, { status: 401 })
    }

    // JWT payload minimal
    const token = jwt.sign(
        { userId: user.id ,
            compteId : user.compteAgent?.id ,
            nom : user.compteAgent?.agent.nom,
            prenom : user.compteAgent?.agent.prenom,
            matricule : user.compteAgent?.agent.matricule,
            email : user.login,
            role : user.roles,
            roleId : user.roles[user.roles.length - 1].role.id
        },
        JWT_SECRET,
        { expiresIn: "1d" }
    )

    const response = NextResponse.json({
        id: user.id,
        compteId : user.compteAgent?.id ,
        login: user.login,
        status : 200,
        message : "Authentification Reussit"
    })

    // Cookie sécurisé
    response.cookies.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/"
    })

    return response
}
