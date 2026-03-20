import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthenticatedUser } from "@/security/auth"
import { requireAccess } from "@/security/authorization"
import {
  canAccessAgentForPermissions,
  getAccessibleAgentIdsForPermissions,
} from "@/server/access/scope"

type HistoriquePayload = {
  affectationId?: number
  ancienPoste?: string | null
  nouveauPoste?: string | null
  ancienGrade?: string | null
  nouveauGrade?: string | null
  motif?: string
}

function parsePositiveInt(value: string | null): number | null {
  if (!value) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

async function ensureHistoriqueAccess(permissionCodes: string[]) {
  const auth = await getAuthenticatedUser()
  if (!auth) {
    return {
      auth: null,
      response: NextResponse.json({ message: "Non autorise" }, { status: 401 }),
    }
  }

  try {
    await requireAccess({ permissions: permissionCodes })
  } catch {
    return {
      auth: null,
      response: NextResponse.json({ message: "Acces interdit" }, { status: 403 }),
    }
  }

  return { auth, response: null }
}

export async function GET(req: Request) {
  try {
    const guard = await ensureHistoriqueAccess(["affectation.read"])
    if (guard.response) return guard.response

    const { searchParams } = new URL(req.url)
    const id = parsePositiveInt(searchParams.get("id"))
    const affectationId = parsePositiveInt(searchParams.get("affectationId"))
    const accessibleAgentIds = await getAccessibleAgentIdsForPermissions(
      guard.auth!.userId,
      ["affectation.read"]
    )

    const data = await prisma.historiqueAffectation.findMany({
      where: {
        ...(id ? { id } : {}),
        ...(affectationId ? { affectationId } : {}),
        ...(accessibleAgentIds === null
          ? {}
          : {
              affectation: {
                agentId: {
                  in: accessibleAgentIds.length ? accessibleAgentIds : [-1],
                },
              },
            }),
      },
      orderBy: { dateChangement: "desc" },
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error("GET HistoriqueAffectation error:", error)
    return NextResponse.json({ data: [] }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const permissionCodes = ["affectation.update", "affectation.assign"]
    const guard = await ensureHistoriqueAccess(permissionCodes)
    if (guard.response) return guard.response

    const body = (await req.json()) as HistoriquePayload
    if (!body.affectationId || !body.motif) {
      return NextResponse.json(
        { message: "affectationId et motif sont requis." },
        { status: 400 }
      )
    }

    const affectation = await prisma.affectation.findUnique({
      where: { id: body.affectationId },
      select: { agentId: true },
    })

    if (!affectation) {
      return NextResponse.json(
        { message: "Affectation introuvable." },
        { status: 404 }
      )
    }

    const allowed = await canAccessAgentForPermissions(
      guard.auth!.userId,
      affectation.agentId,
      permissionCodes
    )

    if (!allowed) {
      return NextResponse.json({ message: "Acces interdit." }, { status: 403 })
    }

    const data = await prisma.historiqueAffectation.create({
      data: {
        affectationId: body.affectationId,
        ancienPoste: body.ancienPoste ?? null,
        nouveauPoste: body.nouveauPoste ?? null,
        ancienGrade: body.ancienGrade ?? null,
        nouveauGrade: body.nouveauGrade ?? null,
        motif: body.motif,
      },
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error("POST HistoriqueAffectation error:", error)
    return NextResponse.json({ data: null }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const permissionCodes = ["affectation.delete", "affectation.update"]
    const guard = await ensureHistoriqueAccess(permissionCodes)
    if (guard.response) return guard.response

    const { searchParams } = new URL(req.url)
    const id = parsePositiveInt(searchParams.get("id"))
    if (!id) {
      return NextResponse.json(
        { message: "Parametre id invalide." },
        { status: 400 }
      )
    }

    const historique = await prisma.historiqueAffectation.findUnique({
      where: { id },
      select: {
        affectation: {
          select: {
            agentId: true,
          },
        },
      },
    })

    if (!historique) {
      return NextResponse.json(
        { message: "Historique introuvable." },
        { status: 404 }
      )
    }

    const allowed = await canAccessAgentForPermissions(
      guard.auth!.userId,
      historique.affectation.agentId,
      permissionCodes
    )

    if (!allowed) {
      return NextResponse.json({ message: "Acces interdit." }, { status: 403 })
    }

    await prisma.historiqueAffectation.delete({ where: { id } })
    return NextResponse.json({ data: true })
  } catch (error) {
    console.error("DELETE HistoriqueAffectation error:", error)
    return NextResponse.json({ data: false }, { status: 500 })
  }
}
