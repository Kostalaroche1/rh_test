import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAuthenticatedUser } from "@/security/auth"
import { requireAccess } from "@/security/authorization"
import { canAccessAgentForPermissions } from "@/server/access/scope"

async function ensurePrimeAccess(permissionCodes: string[]) {
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
      response: NextResponse.json({ message: "Acces refuse" }, { status: 403 }),
    }
  }

  return { auth, response: null }
}

export async function POST(req: Request) {
  try {
    const guard = await ensurePrimeAccess(["paie.create"])
    if (guard.response) return guard.response

    const body = await req.json()
    const paieId = Number(body?.paieId)

    if (!Number.isFinite(paieId)) {
      return NextResponse.json({ message: "paieId invalide" }, { status: 400 })
    }

    const paie = await prisma.paie.findUnique({
      where: { id: paieId },
      select: { id: true, agentId: true },
    })

    if (!paie) {
      return NextResponse.json({ message: "Paie introuvable" }, { status: 404 })
    }

    const allowed = await canAccessAgentForPermissions(
      guard.auth!.userId,
      paie.agentId,
      ["paie.create"]
    )

    if (!allowed) {
      return NextResponse.json({ message: "Acces refuse" }, { status: 403 })
    }

    const prime = await prisma.prime.create({
      data: {
        paieId,
        type: body.type,
        montant: body.montant,
      },
    })

    return NextResponse.json(prime)
  } catch (error) {
    console.error("POST /api/paie/prime failed:", error)
    return NextResponse.json({ message: "Erreur creation prime" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const guard = await ensurePrimeAccess(["paie.update"])
    if (guard.response) return guard.response

    const body = await req.json()
    const id = Number(body?.id)

    if (!Number.isFinite(id)) {
      return NextResponse.json({ message: "id invalide" }, { status: 400 })
    }

    const existingPrime = await prisma.prime.findUnique({
      where: { id },
      select: {
        paie: {
          select: {
            agentId: true,
          },
        },
      },
    })

    if (!existingPrime) {
      return NextResponse.json({ message: "Prime introuvable" }, { status: 404 })
    }

    const allowed = await canAccessAgentForPermissions(
      guard.auth!.userId,
      existingPrime.paie.agentId,
      ["paie.update"]
    )

    if (!allowed) {
      return NextResponse.json({ message: "Acces refuse" }, { status: 403 })
    }

    const prime = await prisma.prime.update({
      where: { id },
      data: {
        type: body.type,
        montant: body.montant,
      },
    })

    return NextResponse.json(prime)
  } catch (error) {
    console.error("PUT /api/paie/prime failed:", error)
    return NextResponse.json({ message: "Erreur mise a jour prime" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const guard = await ensurePrimeAccess(["paie.delete"])
    if (guard.response) return guard.response

    const body = await req.json()
    const id = Number(body?.id)

    if (!Number.isFinite(id)) {
      return NextResponse.json({ message: "id invalide" }, { status: 400 })
    }

    const existingPrime = await prisma.prime.findUnique({
      where: { id },
      select: {
        paie: {
          select: {
            agentId: true,
          },
        },
      },
    })

    if (!existingPrime) {
      return NextResponse.json({ message: "Prime introuvable" }, { status: 404 })
    }

    const allowed = await canAccessAgentForPermissions(
      guard.auth!.userId,
      existingPrime.paie.agentId,
      ["paie.delete"]
    )

    if (!allowed) {
      return NextResponse.json({ message: "Acces refuse" }, { status: 403 })
    }

    await prisma.prime.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/paie/prime failed:", error)
    return NextResponse.json({ message: "Erreur suppression prime" }, { status: 500 })
  }
}
