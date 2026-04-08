'use server'
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/security/auth"
import { requireAccess } from "@/security/authorization"

function getAge(d: Date) {
  const today = new Date()
  let age = today.getFullYear() - d.getFullYear()
  const m = today.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--
  return age
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: Request) {
  const auth = await getAuthenticatedUser()
  if (!auth) {
    return NextResponse.json({ status: 401, message: "Non authentifie" }, { status: 401 })
  }

  try {
    await requireAccess({
      permissions: ["agent.create", "user.create"],
    })
  } catch {
    return NextResponse.json({ status: 403, message: "Acces interdit" }, { status: 403 })
  }

  const data = await req.json()
  console.log(data, "from backend")

  try {
    // ✅ champs obligatoires (minimum)
    const matricule = (data.matricule ?? "").trim()
    const nom = (data.nom ?? "").trim()
    const prenom = (data.prenom ?? "").trim()
    const email = (data.email ?? "").trim().toLowerCase()
    const password = (data.password ?? "").toString()
    const roleIdRaw = data.roleId

    if (!matricule || !nom || !prenom || !email || !password || roleIdRaw == null) {
      return NextResponse.json(
        { status: 400, message: "Champs obligatoires manquants (matricule, nom, prenom, email, password, roleId)" },
        { status: 400 }
      )
    }

    // ✅ email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { status: 400, message: "Email invalide" },
        { status: 400 }
      )
    }

    // ✅ mot de passe (tu peux durcir)
    if (password.length < 6) {
      return NextResponse.json(
        { status: 400, message: "Mot de passe trop court (min 6 caractères)" },
        { status: 400 }
      )
    }

    // ✅ rôle id
    const roleId = Number(roleIdRaw)
    if (!Number.isFinite(roleId)) {
      return NextResponse.json(
        { status: 400, message: "roleId invalide" },
        { status: 400 }
      )
    }

    // ✅ genre (selon tes valeurs)
    const genre = (data.genre ?? "").toString().trim().toUpperCase()
    if (!["MASCULIN", "FEMININ"].includes(genre)) {
      return NextResponse.json(
        { status: 400, message: "Genre invalide (MASCULIN ou FEMININ)" },
        { status: 400 }
      )
    }

    // ✅ Validation date naissance
    const dateNais = new Date(data.datenais)
    if (!data.datenais || Number.isNaN(dateNais.getTime())) {
      return NextResponse.json(
        { status: 400, message: "Date de naissance invalide" },
        { status: 400 }
      )
    }

    // ✅ règle: < 17 ans interdit
    const age = getAge(dateNais)
    if (age < 17) {
      return NextResponse.json(
        { status: 403, message: "Impossible : une personne de moins de 17 ans ne peut pas ouvrir un compte." },
        { status: 403 }
      )
    }

    // ✅ vérif unicité AVANT transaction (évite P2002)
    const [loginExists, matriculeExists] = await Promise.all([
      prisma.utilisateur.findUnique({ where: { login : email }, select: { id: true } }),
      prisma.agent.findFirst({ where: { matricule : matricule }, select: { id: true } }),
    ])

    if (loginExists) {
      return NextResponse.json(
        { status: 409, message: "Cet email est déjà utilisé" },
        { status: 409 }
      )
    }

    if (matriculeExists) {
      return NextResponse.json(
        { status: 409, message: "Ce matricule existe déjà" },
        { status: 409 }
      )
    }

    // ✅ (optionnel) vérifier que le rôle existe
    const roleExists = await prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true },
    })
    if (!roleExists) {
      return NextResponse.json(
        { status: 404, message: "Rôle introuvable" },
        { status: 404 }
      )
    }

    // ✅ Transaction inchangée (juste valeurs nettoyées)
    const dataAll = await prisma.$transaction(async (db) => {
      const agent = await db.agent.create({
        data: {
          matricule,
          dateEntree: new Date(),
          nom,
          prenom,
          statut: data.statut, // tu peux aussi valider si enum
          genre,
          datenais: dateNais,
          actif: false,
        },
      })

      const mopasse = await bcrypt.hash(password, 10)

      const utilisateur = await db.utilisateur.create({
        data: {
          login: email,
          motDePasse: mopasse,
          actif: false,
        },
      })

      const utilisateurRole = await db.utilisateurRole.create({
        data: {
          roleId,
          utilisateurId: utilisateur.id,
          attribuePar: data.user?.id || utilisateur.id,
        },
      })

      const CreationCompte = await db.compteAgent.create({
        data: {
          agentId: agent.id,
          utilisateurId: utilisateur.id,
          liePar: data.user?.id || utilisateur.id,
        },
      })

      return { CreationCompte, utilisateur, agent, utilisateurRole }
    })

    console.log(dataAll, "all data")

    return NextResponse.json(
      { status: 200, message: "Compte créé avec succès" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error(error)

    // ✅ Si malgré tout Prisma renvoie P2002, on renvoie un message clair
    if (error?.code === "P2002") {
      return NextResponse.json(
        { status: 409, message: "Conflit: donnée unique déjà existante" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { status: 500, message: "Erreur serveur" },
      { status: 500 }
    )
  }
}

