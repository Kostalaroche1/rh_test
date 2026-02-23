
import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

// GET : liste des affectations
export async function GET() {
  const data = await prisma.affectation.findMany({
    include: {
      agent: true,
      poste: true,
      fonction: true,
      grade: true,
      departement: true,
      direction: true,
      site: true,
      historique: true,
    },
    orderBy: { dateDebut: "desc" },
  })

  return NextResponse.json({ data: data })
}

// POST : créer une affectation
export async function POST(req: Request) {
  const body = await req.json()

  const active = await prisma.affectation.findFirst({
    where: {
      agentId: body.agentId,
      dateFin: null
    }
  })

  if (active) {
    await prisma.affectation.update({
      where: { id: active.id },
      data: {
        dateFin: new Date()
      }
    })
  }

const datedeb = new Date(body.dateDebut)
  const data = await prisma.affectation.create({
    data: {
      agentId: body.agentId,
      posteId: body.posteId,
      fonctionId: body.fonctionId || null,
      gradeId: body.gradeId,
      departementId: body.departementId,
      directionId: body.directionId,
      siteId: body.siteId,
      dateDebut: datedeb,
      dateFin: null,
      motif: body.motif,
      type: body.type,
    },
  })

  return NextResponse.json(data)
}

// PUT : modifier
export async function PUT(req: Request) {
  const body = await req.json()

  const data = await prisma.affectation.update({
    where: { id: body.id },
    data: {
      posteId: body.posteId,
      fonctionId: body.fonctionId || null,
      gradeId: body.gradeId,
      departementId: body.departementId,
      directionId: body.directionId,
      siteId: body.siteId,
      dateDebut: new Date(body.dateDebut),
      dateFin: body.dateFin ? new Date(body.dateFin) : null,
      motif: body.motif,
      type: body.type,
    },
  })

  return NextResponse.json(data)
}

// DELETE
export async function DELETE(Req: Request) {
  const body = await Req.json();
  await prisma.affectation.delete({
    where: { id: body.id },
  })

  return NextResponse.json({ success: true })
}
