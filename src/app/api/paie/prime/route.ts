import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// ➕ CREATE Prime
export async function POST(req: Request) {
  const body = await req.json()

  const prime = await prisma.prime.create({
    data: {
      paieId: body.paieId,
      type: body.type,
      montant: body.montant
    }
  })

  return NextResponse.json(prime)
}

// ✏️ UPDATE Prime
export async function PUT(req: Request) {
  const body = await req.json()

  const prime = await prisma.prime.update({
    where: { id: body.id },
    data: {
      type: body.type,
      montant: body.montant
    }
  })

  return NextResponse.json(prime)
}

// ❌ DELETE Prime
export async function DELETE(req: Request) {
  const body = await req.json()

  await prisma.prime.delete({
    where: { id: body.id }
  })

  return NextResponse.json({ success: true })
}
