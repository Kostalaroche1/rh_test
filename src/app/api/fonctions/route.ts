import prisma  from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/security/auth"
import { requireAccess } from "@/security/authorization"

async function ensureFonctionAccess(permission: string) {
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
  const guard = await ensureFonctionAccess("fonction.read")
  if (!guard.ok) return guard.response

  const data = await prisma.fonction.findMany({
    include: { poste: true },
  })
  return NextResponse.json({data : data})
}

export async function POST(req : Request) {
  const guard = await ensureFonctionAccess("fonction.create")
  if (!guard.ok) return guard.response

  const body = await req.json()
  const data = await prisma.fonction.create({ data: body })
  return NextResponse.json(data)
}
export async function PUT(req: Request) {
  const guard = await ensureFonctionAccess("fonction.update")
  if (!guard.ok) return guard.response

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
  const guard = await ensureFonctionAccess("fonction.delete")
  if (!guard.ok) return guard.response

  const body = await req.json()
  const data = await prisma.fonction.delete({
    where: { id: body.id }
  })
  return NextResponse.json(data)
}
