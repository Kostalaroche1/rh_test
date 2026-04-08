import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";

async function ensureTypePlanificationAccess(permission: string) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: "Non autorise" }, { status: 401 }),
      auth: null,
    };
  }

  try {
    await requireAccess({ permissions: [permission] });
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json({ message: "Acces refuse" }, { status: 403 }),
      auth: null,
    };
  }

  return { ok: true as const, auth };
}

export async function GET() {
  const guard = await ensureTypePlanificationAccess("type_planification.read");
  if (!guard.ok) return guard.response;

  const data = await prisma.typePlanification.findMany({
    orderBy: [{ nom: "asc" }],
  });

  return NextResponse.json({ data }, { status: 200 });
}

export async function POST(req: Request) {
  const guard = await ensureTypePlanificationAccess("type_planification.create");
  if (!guard.ok) return guard.response;

  const body = await req.json();

  const data = await prisma.typePlanification.create({
    data: {
      nom: body.nom,
      code: body.code,
      description: body.description ?? null,
      actif: body.actif ?? true,
      systeme: body.systeme ?? false,
    },
  });

  return NextResponse.json({ data }, { status: 201 });
}

export async function PUT(req: Request) {
  const guard = await ensureTypePlanificationAccess("type_planification.update");
  if (!guard.ok) return guard.response;

  const body = await req.json();

  const data = await prisma.typePlanification.update({
    where: { id: Number(body.id) },
    data: {
      nom: body.nom,
      code: body.code,
      description: body.description ?? null,
      actif: body.actif ?? true,
    },
  });

  return NextResponse.json({ data }, { status: 200 });
}

export async function DELETE(req: Request) {
  const guard = await ensureTypePlanificationAccess("type_planification.delete");
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const id = Number(body.id);

  const existing = await prisma.typePlanification.findUnique({
    where: { id },
    select: { systeme: true, _count: { select: { planifications: true } } },
  });

  if (!existing) {
    return NextResponse.json({ message: "Type introuvable" }, { status: 404 });
  }

  if (existing.systeme) {
    return NextResponse.json(
      { message: "Un type systeme ne peut pas etre supprime." },
      { status: 400 }
    );
  }

  if ((existing._count?.planifications ?? 0) > 0) {
    return NextResponse.json(
      { message: "Ce type est deja utilise par des planifications." },
      { status: 400 }
    );
  }

  await prisma.typePlanification.delete({
    where: { id },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
