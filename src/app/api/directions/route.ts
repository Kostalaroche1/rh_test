import  prisma  from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const data = await prisma.direction.findMany({
    include: { departements: true },
  })
  console.log(data , 'direction all')
  return NextResponse.json({data : data})
}

export async function POST(req : Request) {
  const body = await req.json()
  const data = await prisma.direction.create({ data: body })
  return NextResponse.json(data)
}
export async function PUT(req : Request) {
  const body = await req.json()
  const data = await prisma.direction.update({ where : {id : body.id},
     data:{
      code : body.code,
      libelle:body.libelle,
      description:body.description
     }  })
  return NextResponse.json(data)
}
export async function DELETE(req : Request) {
  const body = await req.json()
  const data = await prisma.direction.delete({ where : {id : body.id}})
  return NextResponse.json(data)
}
