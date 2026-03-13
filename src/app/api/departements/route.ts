import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/security/auth"
import { requireAccess } from "@/security/authorization"

async function ensureDepartementAccess(permission: string) {
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
  const guard = await ensureDepartementAccess("departement.read")
  if (!guard.ok) return guard.response

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
  const guard = await ensureDepartementAccess("departement.create")
  if (!guard.ok) return guard.response

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
  const guard = await ensureDepartementAccess("departement.update")
  if (!guard.ok) return guard.response

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
  const guard = await ensureDepartementAccess("departement.delete")
  if (!guard.ok) return guard.response

  const body = await req.json()
  console.log(body , "departement post")
  const data = await prisma.departement.delete({where:{id : body.id} })
  return NextResponse.json(data)
}
