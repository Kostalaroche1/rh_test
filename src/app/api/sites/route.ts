import prisma from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/security/auth"
import { requireAccess } from "@/security/authorization"

async function ensureSiteAccess(permission: string) {
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
  const guard = await ensureSiteAccess("site.read")
  if (!guard.ok) return guard.response

  const data = await prisma.site.findMany({
    include: { departements: true },
  })
  return NextResponse.json({data : data})
}

export async function POST(req : Request) {
  const guard = await ensureSiteAccess("site.create")
  if (!guard.ok) return guard.response

  const body = await req.json()
  const data = await prisma.site.create({ data: body })
  return NextResponse.json(data)
}
export async function PUT(req: Request) {
  const guard = await ensureSiteAccess("site.update")
  if (!guard.ok) return guard.response

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
  const guard = await ensureSiteAccess("site.delete")
  if (!guard.ok) return guard.response

  const body = await req.json()
  const data = await prisma.site.delete({
    where: { id: body.id }
  })
  return NextResponse.json(data)
}
