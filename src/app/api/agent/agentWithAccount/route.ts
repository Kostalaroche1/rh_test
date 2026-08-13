import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/security/auth"
import { requireAccess } from "@/security/authorization"
import {
  canAssignRoleFromContext,
  getAccessControlGovernanceContext,
} from "@/server/access/access-control-governance"

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

  try {
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

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { status: 400, message: "Email invalide" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { status: 400, message: "Mot de passe trop court (min 6 caracteres)" },
        { status: 400 }
      )
    }

    const roleId = Number(roleIdRaw)
    if (!Number.isFinite(roleId)) {
      return NextResponse.json(
        { status: 400, message: "roleId invalide" },
        { status: 400 }
      )
    }

    const genre = (data.genre ?? "").toString().trim().toUpperCase()
    if (!["MASCULIN", "FEMININ"].includes(genre)) {
      return NextResponse.json(
        { status: 400, message: "Genre invalide (MASCULIN ou FEMININ)" },
        { status: 400 }
      )
    }

    const dateNais = new Date(data.datenais)
    if (!data.datenais || Number.isNaN(dateNais.getTime())) {
      return NextResponse.json(
        { status: 400, message: "Date de naissance invalide" },
        { status: 400 }
      )
    }

    const age = getAge(dateNais)
    if (age < 17) {
      return NextResponse.json(
        { status: 403, message: "Impossible : une personne de moins de 17 ans ne peut pas ouvrir un compte." },
        { status: 403 }
      )
    }

    const [loginExists, matriculeExists] = await Promise.all([
      prisma.utilisateur.findUnique({ where: { login: email }, select: { id: true } }),
      prisma.agent.findFirst({ where: { matricule }, select: { id: true } }),
    ])

    if (loginExists) {
      return NextResponse.json(
        { status: 409, message: "Cet email est deja utilise" },
        { status: 409 }
      )
    }

    if (matriculeExists) {
      return NextResponse.json(
        { status: 409, message: "Ce matricule existe deja" },
        { status: 409 }
      )
    }

    const roleExists = await prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true, key: true, code: true, nom: true },
    })
    if (!roleExists) {
      return NextResponse.json(
        { status: 404, message: "Role introuvable" },
        { status: 404 }
      )
    }

    const governanceContext = await getAccessControlGovernanceContext(auth)
    if (!(await canAssignRoleFromContext(governanceContext, roleExists))) {
      return NextResponse.json(
        { status: 403, message: "Vous ne pouvez attribuer que les roles autorises dans votre espace d'administration." },
        { status: 403 }
      )
    }

    const dataAll = await prisma.$transaction(async (db) => {
      const agent = await db.agent.create({
        data: {
          matricule,
          dateEntree: new Date(),
          nom,
          prenom,
          statut: data.statut,
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
          attribuePar: auth.userId,
        },
      })

      const CreationCompte = await db.compteAgent.create({
        data: {
          agentId: agent.id,
          utilisateurId: utilisateur.id,
          liePar: auth.userId,
        },
      })

      return { CreationCompte, utilisateur, agent, utilisateurRole }
    })

    void dataAll

    return NextResponse.json(
      { status: 200, message: "Compte cree avec succes" },
      { status: 200 }
    )
  } catch (error: any) {
    console.error(error)

    if (error?.code === "P2002") {
      return NextResponse.json(
        { status: 409, message: "Conflit: donnee unique deja existante" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { status: 500, message: "Erreur serveur" },
      { status: 500 }
    )
  }
}
