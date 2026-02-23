import prisma  from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const data = await prisma.fonction.findMany({
    include: { poste: true },
  })
  return NextResponse.json({data : data})
}

export async function POST(req : Request) {
  const body = await req.json()
  const data = await prisma.fonction.create({ data: body })
  return NextResponse.json(data)
}
export async function PUT(req: Request) {
  const body = await req.json()
  const data = await prisma.fonction.update({
    where: { id: body.id },
    data: {
      code :body.code,
      libelle : body.libelle,
      posteId : body.posteId
    }
  })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const body = await req.json()
  const data = await prisma.fonction.delete({
    where: { id: body.id }
  })
  return NextResponse.json(data)
}