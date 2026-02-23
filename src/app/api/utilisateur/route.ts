import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/security/auth"
import { requireRole } from "@/security/authorization"
import { listerUtilisateurs } from "@/app/application/utilisateur/listerUtilisateurs"
import { creerUtilisateur } from "@/app/application/utilisateur/creerUtilisateur"
import { modifierUtilisateur } from "@/app/application/utilisateur/modifierUtilisateur"
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * GET /api/utilisateurs
 * Rôles autorisés : ADMIN, RH
 */
export async function GET() {
    // 1️⃣ Vérifier authentification
    const auth = getAuthenticatedUser()
    if (!auth) {
        return NextResponse.json(
            { message: "Non authentifié" },
            { status: 401 }
        )
    }

    // 2️⃣ Vérifier autorisation (rôles)
    try {
        await requireRole(["ADMIN", "RH"])
    } catch {
        return NextResponse.json(
            { message: "Accès interdit" },
            { status: 403 },
        )
    }

    // 3️⃣ Action métier
    const users = await listerUtilisateurs()
    return NextResponse.json(users)
}

/**
 * POST /api/utilisateurs
 * Rôles autorisés : ADMIN
 */
export async function POST(req: Request) {
    const auth : any = await getAuthenticatedUser()
    // console.log(auth,"here auth")
    // if (!auth) {
    //     return NextResponse.json(
    //         { message: "Non authentifié" },
    //         { status: 401 }
    //     )
    // }

    // // try {
    // //     await requireRole(["ADMIN"])
    // // } catch {
    // //     return NextResponse.json(
    // //         { message: "Accès interdit" },
    // //         { status: 403 }
    // //     )
    // // }

    // // const { login, motDePasse, roleId }
    const data = await req.json()
    // console.log(data,"data from user client side")

    // const user = await creerUtilisateur(
    //     login,
    //     motDePasse,
    //     roleId,
    //     auth.userId
    // )

    // return NextResponse.json(
    //     // user
    //     {status:"ok"}

    // )

  const hashedPassword = await bcrypt.hash(data.motDePasse, 10)

  const utilisateur = await prisma.utilisateur.create({
    data: {
      login: data.login,
      motDePasse: hashedPassword,
      actif: true,
      // dateCreation : automatique si @default(now())
    },
  })
  console.log('Utilisateur créé :', utilisateur)

  // -----------------------
  // 3️⃣ Ajouter un agent
  // -----------------------
//   const agent = await prisma.agent.create({
//     data: {
//       matricule: 'AGT00124',
//       nom: 'Dupont1',
//       prenom: 'Alice2',
//       statut: 'Actif',
//       dateEntree: new Date('2022-01-01'),
//       actif: true,
//     },
//   })
//   console.log('Agent créé :', agent.nom, agent.prenom)

  const roles = await prisma.role.findFirst({
    where : {nom : "Utilisateur"}
  })
  console.log('roles find créé :', roles)

  // -----------------------
  // 4️⃣ Associer l’utilisateur à un rôle
  // -----------------------
  const utilisateurRole = await prisma.utilisateurRole.create({
    data: {
      utilisateurId: utilisateur.id,
      roleId:roles?.id,
      attribuePar: auth.role[0].id
    },
  })

//   const compteAgent = await prisma.compteAgent.create({
//     data : {
//       agentId : agent.id,
//       utilisateurId : utilisateur.id,
//       liePar : 1
//     }
//   })
    console.log(
    `UtilisateurRole créé : utilisateurId`
  )
  console.log(
    `UtilisateurRole créé : utilisateurId`
  )
}



/**
 * PUT /api/utilisateurs
 * Rôles autorisés : ADMIN
 */
export async function PUT(req: Request) {
    const auth = getAuthenticatedUser()
    if (!auth) {
        return NextResponse.json(
            { message: "Non authentifié" },
            { status: 401 }
        )
    }

    try {
        await requireRole(["ADMIN"])
    } catch {
        return NextResponse.json(
            { message: "Accès interdit" },
            { status: 403 }
        )
    }

    const { id, data } = await req.json()
    const user = await modifierUtilisateur(id, data)

    return NextResponse.json(user)
}
