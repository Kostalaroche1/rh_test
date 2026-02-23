import prisma  from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const data = await prisma.grade.findMany()
  return NextResponse.json({data : data})
}

export async function POST(req : Request) {
  const body = await req.json()
  const data = await prisma.grade.create({ data: body })
  return NextResponse.json(data)
}
export async function PUT(req: Request) {
  const body = await req.json()
  const data = await prisma.grade.update({
    where: { id: body.id },
    data: {
      code : body.code,
      indiceSalarial : body.indiceSalarial,
      libelle : body.libelle
    }
  })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const body = await req.json()
  const data = await prisma.grade.delete({
    where: { id: body.id }
  })
  return NextResponse.json(data)
}