import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";

async function ensureTypeCongeAccess(permission: string) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non autorise" }, { status: 401 });
  }

  try {
    await requireAccess({
      permissions: [permission],
    });
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  return null;
}

export async function POST(req: Request) {
  const guard = await ensureTypeCongeAccess("type_conge.create");
  if (guard) return guard;

  const body = await req.json();
  const auth = await getAuthenticatedUser();
  const code = String(body?.code ?? "").trim();
  const libelle = String(body?.libelle ?? "").trim();
  const dureeMax = Number(body?.dureeMax);
  const allocationConge = Number(body?.allocationConge ?? 0);

  if (!code || !libelle || !Number.isFinite(dureeMax)) {
    return NextResponse.json(
      { message: "code, libelle et dureeMax sont obligatoires" },
      { status: 400 }
    );
  }

  const result = await prisma.typeConge.create({
    data: {
      code,
      libelle,
      dureeMax,
      allocationConge: Number.isFinite(allocationConge) ? allocationConge : 0,
      createur: {
        connect: { id: auth!.userId },
      },
    },
  });

  return NextResponse.json({ status: 200, result }, { status: 200 });
}

export async function PUT(req: Request) {
  const guard = await ensureTypeCongeAccess("type_conge.update");
  if (guard) return guard;

  const body = await req.json();
  const auth = await getAuthenticatedUser();
  const id = Number(body?.id);

  if (!Number.isFinite(id)) {
    return NextResponse.json({ message: "id invalide" }, { status: 400 });
  }

  const result = await prisma.typeConge.update({
    where: { id },
    data: {
      code: String(body?.code ?? "").trim(),
      libelle: String(body?.libelle ?? "").trim(),
      dureeMax: Number(body?.dureeMax),
      allocationConge: Number(body?.allocationConge ?? 0),
      createurId: auth!.userId,
    },
  });

  return NextResponse.json({ status: 200, result }, { status: 200 });
}

export async function GET() {
  const guard = await ensureTypeCongeAccess("type_conge.read");
  if (guard) return guard;

  const getData = await prisma.typeConge.findMany({
    include: { createur: true },
    orderBy: [{ libelle: "asc" }],
  });

  return NextResponse.json({ status: 200, getData }, { status: 200 });
}

export async function DELETE(req: Request) {
  const guard = await ensureTypeCongeAccess("type_conge.delete");
  if (guard) return guard;

  const body = await req.json();
  const id = Number(body?.id);

  if (!Number.isFinite(id)) {
    return NextResponse.json({ message: "id invalide" }, { status: 400 });
  }

  await prisma.typeConge.delete({
    where: { id },
  });

  return NextResponse.json({ status: 200 }, { status: 200 });
}

