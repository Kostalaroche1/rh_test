import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";

async function ensureTypeUniteAccess(permission: string) {
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
  const guard = await ensureTypeUniteAccess("type_unite_organisationnelle.read");
  if (!guard.ok) return guard.response;

  const data = await prisma.typeUniteOrganisationnelle.findMany({
    orderBy: [{ ordre: "asc" }, { nom: "asc" }],
  });

  return NextResponse.json({ data }, { status: 200 });
}

export async function POST(req: Request) {
  const guard = await ensureTypeUniteAccess("type_unite_organisationnelle.create");
  if (!guard.ok) return guard.response;

  const body = await req.json();

  const data = await prisma.typeUniteOrganisationnelle.create({
    data: {
      nom: body.nom,
      code: body.code,
      description: body.description ?? null,
      ordre: Number(body.ordre ?? 0),
      actif: body.actif ?? true,
      systeme: body.systeme ?? false,
    },
  });

  return NextResponse.json({ data }, { status: 201 });
}

export async function PUT(req: Request) {
  const guard = await ensureTypeUniteAccess("type_unite_organisationnelle.update");
  if (!guard.ok) return guard.response;

  const body = await req.json();

  const data = await prisma.typeUniteOrganisationnelle.update({
    where: { id: Number(body.id) },
    data: {
      nom: body.nom,
      code: body.code,
      description: body.description ?? null,
      ordre: Number(body.ordre ?? 0),
      actif: body.actif ?? true,
    },
  });

  return NextResponse.json({ data }, { status: 200 });
}

export async function DELETE(req: Request) {
  const guard = await ensureTypeUniteAccess("type_unite_organisationnelle.delete");
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const id = Number(body.id);

  const existing = await prisma.typeUniteOrganisationnelle.findUnique({
    where: { id },
    select: { systeme: true, _count: { select: { unites: true } } },
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

  if ((existing._count?.unites ?? 0) > 0) {
    return NextResponse.json(
      { message: "Ce type est deja utilise par des unites organisationnelles." },
      { status: 400 }
    );
  }

  await prisma.typeUniteOrganisationnelle.delete({
    where: { id },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
