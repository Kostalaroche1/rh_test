import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/security/auth"
import { requireAccess } from "@/security/authorization"

async function ensureDirectionAccess(permission: string) {
  const auth = await getAuthenticatedUser()
  if (!auth) {
    return { ok: false as const, response: NextResponse.json({ message: "Non autorise" }, { status: 401 }) }
  }

  try {
    await requireAccess({ permissions: [permission] })
  } catch {
    return { ok: false as const, response: NextResponse.json({ message: "Acces refuse" }, { status: 403 }) }
  }

  return { ok: true as const }
}

export async function GET() {
  const guard = await ensureDirectionAccess("direction.read")
  if (!guard.ok) return guard.response

  const data = await prisma.direction.findMany({
    include: { departements: true },
  })
  console.log(data , 'direction all')
  return NextResponse.json({data : data})
}

export async function POST(req : Request) {
  const guard = await ensureDirectionAccess("direction.create")
  if (!guard.ok) return guard.response

  const body = await req.json()
  const data = await prisma.direction.create({ data: body })
  return NextResponse.json(data)
}
export async function PUT(req : Request) {
  const guard = await ensureDirectionAccess("direction.update")
  if (!guard.ok) return guard.response

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
  const guard = await ensureDirectionAccess("direction.delete")
  if (!guard.ok) return guard.response

  const body = await req.json()
  const data = await prisma.direction.delete({ where : {id : body.id}})
  return NextResponse.json(data)
}
