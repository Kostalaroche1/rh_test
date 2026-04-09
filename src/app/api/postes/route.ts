import prisma  from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/security/auth"
import { requireAccess } from "@/security/authorization"
import {
  canAccessUnitForPermissions,
  canAccessOrganisationEntityForPermissions,
  getAccessibleOrganisationIdsForPermissions,
} from "@/server/access/scope"

async function ensurePosteAccess(permission: string) {
  const auth = await getAuthenticatedUser()
  if (!auth) {
    return { ok: false as const, response: NextResponse.json({ message: "Non autorise" }, { status: 401 }) }
  }

  try {
    await requireAccess({ permissions: [permission] })
  } catch {
    return { ok: false as const, response: NextResponse.json({ message: "Acces refuse" }, { status: 403 }) }
  }

  return { ok: true as const }
}

export async function GET() {
  const auth = await getAuthenticatedUser()
  if (!auth) {
    return NextResponse.json({ message: "Non autorise" }, { status: 401 })
  }

  const guard = await ensurePosteAccess("poste.read")
  if (!guard.ok) return guard.response

  const accessibleIds = await getAccessibleOrganisationIdsForPermissions(
    auth.userId,
    ["poste.read"],
    "poste"
  )

  const data = await prisma.poste.findMany({
    where:
      accessibleIds === null
        ? undefined
        : {
            id: { in: accessibleIds.length ? accessibleIds : [-1] },
          },
    include: {
      uniteOrganisationnelle: true,
      fonctions: true,
    },
  })
  return NextResponse.json({data : data})
}

export async function POST(req : Request) {
  const auth = await getAuthenticatedUser()
  if (!auth) {
    return NextResponse.json({ message: "Non autorise" }, { status: 401 })
  }

  const guard = await ensurePosteAccess("poste.create")
  if (!guard.ok) return guard.response

  const body = await req.json()
  const uniteOrganisationnelleId = Number(body.uniteOrganisationnelleId)
  if (!Number.isFinite(uniteOrganisationnelleId)) {
    return NextResponse.json({ message: "uniteOrganisationnelleId invalide" }, { status: 400 })
  }

  const unite = await prisma.uniteOrganisationnelle.findUnique({
    where: { id: uniteOrganisationnelleId },
    select: {
      id: true,
      parentId: true,
      code: true,
      parent: {
        select: {
          id: true,
          code: true,
          parentId: true,
          parent: {
            select: {
              id: true,
              code: true,
            },
          },
        },
      },
    },
  })

  if (!unite) {
    return NextResponse.json({ message: "Unite introuvable" }, { status: 404 })
  }

  const canAccessUnit = await canAccessUnitForPermissions(
    auth.userId,
    uniteOrganisationnelleId,
    ["unite_organisationnelle.read", "poste.create"]
  )
  if (!canAccessUnit) {
    return NextResponse.json({ message: "Acces refuse" }, { status: 403 })
  }

  const data = await prisma.poste.create({
    data: {
      code: body.code,
      libelle: body.libelle,
      description: body.description ?? null,
      uniteOrganisationnelleId,
    },
  })
  return NextResponse.json(data)
}
export async function PUT(req: Request) {
  const auth = await getAuthenticatedUser()
  if (!auth) {
    return NextResponse.json({ message: "Non autorise" }, { status: 401 })
  }

  const guard = await ensurePosteAccess("poste.update")
  if (!guard.ok) return guard.response

  const body = await req.json()
  if (!(await canAccessOrganisationEntityForPermissions(auth.userId, Number(body.id), ["poste.update"], "poste"))) {
    return NextResponse.json({ message: "Acces refuse" }, { status: 403 })
  }

  const uniteOrganisationnelleId = body.uniteOrganisationnelleId
    ? Number(body.uniteOrganisationnelleId)
    : undefined

  if (Number.isFinite(uniteOrganisationnelleId)) {
    const scopedUnitId = uniteOrganisationnelleId as number
    const canAccessUnit = await canAccessUnitForPermissions(auth.userId, scopedUnitId, [
      "unite_organisationnelle.read",
      "poste.update",
    ])

    if (!canAccessUnit) {
      return NextResponse.json({ message: "Acces refuse" }, { status: 403 })
    }

    const unit = await prisma.uniteOrganisationnelle.findUnique({
      where: { id: scopedUnitId },
      select: { id: true },
    })

    if (!unit) {
      return NextResponse.json({ message: "Unite introuvable" }, { status: 404 })
    }
  }

  const data = await prisma.poste.update({
    where: { id: body.id },
    data: {
      code : body.code,
      libelle : body.libelle,
      description: body.description ?? null,
      uniteOrganisationnelleId: Number.isFinite(uniteOrganisationnelleId) ? uniteOrganisationnelleId : undefined,
    }
  })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const auth = await getAuthenticatedUser()
  if (!auth) {
    return NextResponse.json({ message: "Non autorise" }, { status: 401 })
  }

  const guard = await ensurePosteAccess("poste.delete")
  if (!guard.ok) return guard.response

  const body = await req.json()
  if (!(await canAccessOrganisationEntityForPermissions(auth.userId, Number(body.id), ["poste.delete"], "poste"))) {
    return NextResponse.json({ message: "Acces refuse" }, { status: 403 })
  }
  const data = await prisma.poste.delete({
    where: { id: body.id }
  })
  return NextResponse.json(data)
}
