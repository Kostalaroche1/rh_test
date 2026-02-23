import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const data = await prisma.departement.findMany({
    include: {
      direction: true,
      postes: true,
      sites: { include: { site: true } },
    },
  })
  return NextResponse.json({data : data})
}

export async function POST(req : Request) {
  const body = await req.json()
  console.log(body , "departement post")
  const data = await prisma.departement.create({ data: {
    code : body.code,
    directionId: parseInt(body.directionId),
    nom : body.nom
  } })
  return NextResponse.json(data)
}

export async function PUT(req : Request) {
  const body = await req.json()
  console.log(body , "departement post")
  const data = await prisma.departement.update({where:{id : body.id}, data: {
    code : body.code,
    directionId: parseInt(body.directionId),
    nom : body.nom
  } })
  return NextResponse.json(data)
}

export async function DELETE(req : Request) {
  const body = await req.json()
  console.log(body , "departement post")
  const data = await prisma.departement.delete({where:{id : body.id} })
  return NextResponse.json(data)
}