import { NextResponse } from "next/server"
import  prisma  from "@/lib/prisma"

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = parsePositiveInt(searchParams.get("id"))
    const affectationId = parsePositiveInt(searchParams.get("affectationId"))

    const data = await prisma.historiqueAffectation.findMany({
      where: {
        ...(id ? { id } : {}),
        ...(affectationId ? { affectationId } : {}),
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
    const body = (await req.json()) as HistoriquePayload
    if (!body.affectationId || !body.motif) {
      return NextResponse.json(
        { message: "affectationId et motif sont requis." },
        { status: 400 }
      )
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
    const { searchParams } = new URL(req.url)
    const id = parsePositiveInt(searchParams.get("id"))
    if (!id) {
      return NextResponse.json(
        { message: "Paramètre id invalide." },
        { status: 400 }
      )
    }

    await prisma.historiqueAffectation.delete({ where: { id } })
    return NextResponse.json({ data: true })
  } catch (error) {
    console.error("DELETE HistoriqueAffectation error:", error)
    return NextResponse.json({ data: false }, { status: 500 })
  }
}
