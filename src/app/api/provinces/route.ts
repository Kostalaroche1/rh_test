import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import {
  canAccessProvinceForPermissions,
  getScopedProvinceIdsForPermissions,
} from "@/server/access/scope";

async function ensureProvinceAccess(permission: string) {
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

  return {
    ok: true as const,
    auth,
  };
}

function normalizeProvinceCode(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, "");
}

export async function GET() {
  const guard = await ensureProvinceAccess("province.read");
  if (!guard.ok) return guard.response;

  const scopedProvinceIds = await getScopedProvinceIdsForPermissions(
    guard.auth!.userId,
    ["province.read"]
  );

  const data = await prisma.province.findMany({
    where:
      scopedProvinceIds === null
        ? undefined
        : {
            id: { in: scopedProvinceIds.length ? scopedProvinceIds : [-1] },
          },
    include: {
      _count: {
        select: {
          unites: true,
          affectations: true,
        },
      },
    },
    orderBy: [{ nom: "asc" }],
  });

  return NextResponse.json({ data }, { status: 200 });
}

export async function POST(req: Request) {
  const guard = await ensureProvinceAccess("province.create");
  if (!guard.ok) return guard.response;

  const scopedProvinceIds = await getScopedProvinceIdsForPermissions(
    guard.auth!.userId,
    ["province.create"]
  );

  if (scopedProvinceIds !== null) {
    return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
  }

  const body = await req.json();
  const code = normalizeProvinceCode(body?.code);
  const nom = String(body?.nom ?? "").trim();
  const description =
    typeof body?.description === "string" && body.description.trim()
      ? body.description.trim()
      : null;
  const actif = body?.actif !== false;

  if (!code || !nom) {
    return NextResponse.json(
      { message: "Le code et le nom de province sont obligatoires." },
      { status: 400 }
    );
  }

  const data = await prisma.province.create({
    data: {
      code,
      nom,
      description,
      actif,
    },
  });

  return NextResponse.json({ data }, { status: 201 });
}

export async function PUT(req: Request) {
  const guard = await ensureProvinceAccess("province.update");
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const id = Number(body?.id);
  const code = normalizeProvinceCode(body?.code);
  const nom = String(body?.nom ?? "").trim();
  const description =
    typeof body?.description === "string" && body.description.trim()
      ? body.description.trim()
      : null;
  const actif = body?.actif !== false;

  if (!Number.isFinite(id)) {
    return NextResponse.json({ message: "id invalide" }, { status: 400 });
  }

  if (!code || !nom) {
    return NextResponse.json(
      { message: "Le code et le nom de province sont obligatoires." },
      { status: 400 }
    );
  }

  const allowed = await canAccessProvinceForPermissions(
    guard.auth!.userId,
    id,
    ["province.update"]
  );

  if (!allowed) {
    return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
  }

  const data = await prisma.province.update({
    where: { id },
    data: {
      code,
      nom,
      description,
      actif,
    },
  });

  return NextResponse.json({ data }, { status: 200 });
}

export async function DELETE(req: Request) {
  const guard = await ensureProvinceAccess("province.delete");
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const id = Number(body?.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ message: "id invalide" }, { status: 400 });
  }

  const allowed = await canAccessProvinceForPermissions(
    guard.auth!.userId,
    id,
    ["province.delete"]
  );

  if (!allowed) {
    return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
  }

  const existing = await prisma.province.findUnique({
    where: { id },
    select: {
      _count: {
        select: {
          unites: true,
          affectations: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ message: "Province introuvable" }, { status: 404 });
  }

  if ((existing._count?.unites ?? 0) > 0 || (existing._count?.affectations ?? 0) > 0) {
    return NextResponse.json(
      {
        message:
          "Cette province est deja liee a des unites/affectations et ne peut pas etre supprimee.",
      },
      { status: 400 }
    );
  }

  await prisma.province.delete({
    where: { id },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
