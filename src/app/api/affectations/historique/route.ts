import { NextResponse } from "next/server"
import  prisma  from "@/lib/prisma"

/* =========================
   GET
   - tous les historiques
   - ou par affectationId
========================= */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const affectationId = searchParams.get("affectationId")

    const data = await prisma.historiqueAffectation.findMany({
      where: affectationId ? { affectationId } : undefined,
      orderBy: { dateChangement: "desc" },
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error("GET HistoriqueAffectation error:", error)
    return NextResponse.json(
      { data: [] },
      { status: 500 }
    )
  }
}

/* =========================
   POST
========================= */
export async function POST(req: Request) {
  try {
    const body = await req.json()

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

    return NextResponse.json({ data })
  } catch (error) {
    console.error("POST HistoriqueAffectation error:", error)
    return NextResponse.json(
      { data: null },
      { status: 500 }
    )
  }

/* =========================
   GET by ID
========================= */
export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await prisma.historiqueAffectation.findUnique({
      where: { id: params.id },
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error("GET HistoriqueAffectation by id error:", error)
    return NextResponse.json(
      { data: null },
      { status: 500 }
    )
  }
}

/* =========================
   DELETE
========================= */
export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.historiqueAffectation.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ data: true })
  } catch (error) {
    console.error("DELETE HistoriqueAffectation error:", error)
    return NextResponse.json(
      { data: false },
      { status: 500 }
    )
  }
}

}
