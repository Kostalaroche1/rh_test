import  prisma  from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const data = await prisma.site.findMany({
    include: { departements: true },
  })
  return NextResponse.json({data : data})
}

export async function POST(req : Request) {
  const body = await req.json()
  const data = await prisma.site.create({ data: body })
  return NextResponse.json(data)
}
export async function PUT(req: Request) {
  const body = await req.json()
  console.log(body , 'grades updates')
  const data = await prisma.site.update({
    where: { id: body.id },
    data: {
      nom : body.nom,
      adresse : body.adresse,
      ville : body.ville
    }
  })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const body = await req.json()
  const data = await prisma.site.delete({
    where: { id: body.id }
  })
  return NextResponse.json(data)
}