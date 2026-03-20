import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import {
  canAccessUnitForPermissions,
  getScopedUnitIdsForPermissions,
} from "@/server/access/scope";

async function ensureUniteAccess(permission: string) {
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

async function rebuildOrganisationPaths() {
  const units = await prisma.uniteOrganisationnelle.findMany({
    select: { id: true, parentId: true },
    orderBy: { id: "asc" },
  });

  const childrenByParent = new Map<number, Array<{ id: number; parentId: number | null }>>();
  for (const unit of units) {
    const key = unit.parentId ?? 0;
    const list = childrenByParent.get(key) ?? [];
    list.push(unit);
    childrenByParent.set(key, list);
  }

  async function visit(parentId: number | null, parentPath: string, level: number) {
    const nodes = childrenByParent.get(parentId ?? 0) ?? [];
    for (const node of nodes) {
      const chemin = `${parentPath}${node.id}/`;
      await prisma.uniteOrganisationnelle.update({
        where: { id: node.id },
        data: {
          chemin,
          niveau: level,
        },
      });
      await visit(node.id, chemin, level + 1);
    }
  }

  await visit(null, "/", 0);
}

export async function GET() {
  const guard = await ensureUniteAccess("unite_organisationnelle.read");
  if (!guard.ok) return guard.response;

  const scopedUnitIds = await getScopedUnitIdsForPermissions(
    guard.auth!.userId,
    ["unite_organisationnelle.read"]
  );

  const data = await prisma.uniteOrganisationnelle.findMany({
    where:
      scopedUnitIds === null
        ? undefined
        : {
            id: { in: scopedUnitIds.length ? scopedUnitIds : [-1] },
          },
    include: {
      typeUnite: true,
      parent: {
        select: { id: true, nom: true, code: true },
      },
      _count: {
        select: {
          enfants: true,
          postes: true,
          affectations: true,
        },
      },
    },
    orderBy: [{ niveau: "asc" }, { nom: "asc" }],
  });

  return NextResponse.json({ data }, { status: 200 });
}

export async function POST(req: Request) {
  const guard = await ensureUniteAccess("unite_organisationnelle.create");
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const parentId = body.parentId ? Number(body.parentId) : null;

  if (parentId) {
    const canAccessParent = await canAccessUnitForPermissions(
      guard.auth!.userId,
      parentId,
      ["unite_organisationnelle.create", "unite_organisationnelle.read"]
    );

    if (!canAccessParent) {
      return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
    }
  }

  const data = await prisma.uniteOrganisationnelle.create({
    data: {
      nom: body.nom,
      code: body.code,
      description: body.description ?? null,
      typeUniteId: Number(body.typeUniteId),
      parentId,
      actif: body.actif ?? true,
    },
  });

  await rebuildOrganisationPaths();

  return NextResponse.json({ data }, { status: 201 });
}

export async function PUT(req: Request) {
  const guard = await ensureUniteAccess("unite_organisationnelle.update");
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const id = Number(body.id);
  const parentId = body.parentId ? Number(body.parentId) : null;

  const canAccessUnit = await canAccessUnitForPermissions(
    guard.auth!.userId,
    id,
    ["unite_organisationnelle.update"]
  );

  if (!canAccessUnit) {
    return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
  }

  if (parentId) {
    const canAccessParent = await canAccessUnitForPermissions(
      guard.auth!.userId,
      parentId,
      ["unite_organisationnelle.update", "unite_organisationnelle.read"]
    );

    if (!canAccessParent) {
      return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
    }
  }

  const data = await prisma.uniteOrganisationnelle.update({
    where: { id },
    data: {
      nom: body.nom,
      code: body.code,
      description: body.description ?? null,
      typeUniteId: Number(body.typeUniteId),
      parentId,
      actif: body.actif ?? true,
    },
  });

  await rebuildOrganisationPaths();

  return NextResponse.json({ data }, { status: 200 });
}

export async function DELETE(req: Request) {
  const guard = await ensureUniteAccess("unite_organisationnelle.delete");
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const id = Number(body.id);

  const canAccessUnit = await canAccessUnitForPermissions(
    guard.auth!.userId,
    id,
    ["unite_organisationnelle.delete"]
  );

  if (!canAccessUnit) {
    return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
  }

  const existing = await prisma.uniteOrganisationnelle.findUnique({
    where: { id },
    select: {
      _count: {
        select: { enfants: true, postes: true, affectations: true },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ message: "Unite introuvable" }, { status: 404 });
  }

  if (
    (existing._count?.enfants ?? 0) > 0 ||
    (existing._count?.postes ?? 0) > 0 ||
    (existing._count?.affectations ?? 0) > 0
  ) {
    return NextResponse.json(
      { message: "Cette unite est deja utilisee et ne peut pas etre supprimee." },
      { status: 400 }
    );
  }

  await prisma.uniteOrganisationnelle.delete({
    where: { id },
  });

  await rebuildOrganisationPaths();

  return NextResponse.json({ success: true }, { status: 200 });
}
