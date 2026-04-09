import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import {
  canAccessProvinceForPermissions,
  getScopedProvinceIdsForPermissions,
} from "@/server/access/scope";

function parseOptionalInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

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

export async function GET(req: Request) {
  const guard = await ensureTypeUniteAccess("type_unite_organisationnelle.read");
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const provinceId = parseOptionalInt(searchParams.get("provinceId"));

  const scopedProvinceIds = await getScopedProvinceIdsForPermissions(
    guard.auth!.userId,
    ["type_unite_organisationnelle.read", "province.read"]
  );

  if (
    Number.isFinite(provinceId) &&
    scopedProvinceIds !== null &&
    !scopedProvinceIds.includes(provinceId as number)
  ) {
    return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
  }

  const effectiveProvinceIds =
    Number.isFinite(provinceId) && provinceId
      ? [provinceId as number]
      : scopedProvinceIds === null
      ? null
      : scopedProvinceIds.length
      ? scopedProvinceIds
      : [-1];

  const data = await prisma.typeUniteOrganisationnelle.findMany({
    where:
      effectiveProvinceIds === null
        ? undefined
        : {
            typeOrgaUniteProvinces: {
              some: {
                provinceId: { in: effectiveProvinceIds },
                actif: true,
              },
            },
          },
    include: {
      parent: {
        select: { id: true, nom: true, code: true, parentId: true },
      },
      enfants: {
        select: { id: true, nom: true, code: true, parentId: true },
      },
      typeOrgaUniteProvinces: {
        where:
          effectiveProvinceIds === null
            ? undefined
            : { provinceId: { in: effectiveProvinceIds } },
        select: {
          id: true,
          provinceId: true,
          uniteOrganisationnelleId: true,
          actif: true,
          province: {
            select: { id: true, code: true, nom: true },
          },
          uniteOrganisationnelle: {
            select: { id: true, nom: true, code: true, parentId: true, niveau: true },
          },
        },
        orderBy: [{ provinceId: "asc" }, { id: "asc" }],
      },
      _count: {
        select: { typeOrgaUniteProvinces: true },
      },
    },
    orderBy: [{ ordre: "asc" }, { nom: "asc" }],
  });

  return NextResponse.json({ data }, { status: 200 });
}

export async function POST(req: Request) {
  const guard = await ensureTypeUniteAccess("type_unite_organisationnelle.create");
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const provinceId = parseOptionalInt(body?.provinceId);
  const parentId = parseOptionalInt(body?.parentId);

  if (!provinceId) {
    return NextResponse.json(
      { message: "La province est obligatoire pour creer un type." },
      { status: 400 }
    );
  }

  const canAccessProvince = await canAccessProvinceForPermissions(
    guard.auth!.userId,
    provinceId,
    ["type_unite_organisationnelle.create", "province.read"]
  );

  if (!canAccessProvince) {
    return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
  }

  const province = await prisma.province.findUnique({
    where: { id: provinceId },
    select: { id: true },
  });

  if (!province) {
    return NextResponse.json({ message: "Province introuvable" }, { status: 404 });
  }

  if (parentId) {
    const parent = await prisma.typeUniteOrganisationnelle.findUnique({
      where: { id: parentId },
      select: {
        id: true,
        typeOrgaUniteProvinces: {
          where: { provinceId, actif: true },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!parent) {
      return NextResponse.json({ message: "Type parent introuvable" }, { status: 404 });
    }

    if (!parent.typeOrgaUniteProvinces.length) {
      return NextResponse.json(
        { message: "Le type parent n'est pas rattache a cette province." },
        { status: 400 }
      );
    }
  }

  const data = await prisma.$transaction(async (tx) => {
    const createdType = await tx.typeUniteOrganisationnelle.create({
      data: {
        nom: body.nom,
        code: body.code,
        description: body.description ?? null,
        parentId: parentId ?? null,
        ordre: Number(body.ordre ?? 0),
        actif: body.actif ?? true,
        systeme: body.systeme ?? false,
      },
    });

    await tx.typeOrgaUniteProvince.create({
      data: {
        typeUniteId: createdType.id,
        provinceId,
        uniteOrganisationnelleId: null,
        actif: true,
      },
    });

    return tx.typeUniteOrganisationnelle.findUnique({
      where: { id: createdType.id },
      include: {
        parent: {
          select: { id: true, nom: true, code: true, parentId: true },
        },
        enfants: {
          select: { id: true, nom: true, code: true, parentId: true },
        },
        typeOrgaUniteProvinces: {
          where: { provinceId },
          select: {
            id: true,
            provinceId: true,
            uniteOrganisationnelleId: true,
            actif: true,
            province: {
              select: { id: true, code: true, nom: true },
            },
            uniteOrganisationnelle: {
              select: { id: true, nom: true, code: true, parentId: true, niveau: true },
            },
          },
        },
      },
    });
  });

  return NextResponse.json({ data }, { status: 201 });
}

export async function PUT(req: Request) {
  const guard = await ensureTypeUniteAccess("type_unite_organisationnelle.update");
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const id = parseOptionalInt(body?.id);
  const provinceId = parseOptionalInt(body?.provinceId);
  const parentId = parseOptionalInt(body?.parentId);

  if (!id) {
    return NextResponse.json({ message: "id invalide" }, { status: 400 });
  }

  const existing = await prisma.typeUniteOrganisationnelle.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "Type introuvable" }, { status: 404 });
  }

  if (provinceId) {
    const canAccessProvince = await canAccessProvinceForPermissions(
      guard.auth!.userId,
      provinceId,
      ["type_unite_organisationnelle.update", "province.read"]
    );

    if (!canAccessProvince) {
      return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
    }
  }

  if (parentId) {
    const parent = await prisma.typeUniteOrganisationnelle.findUnique({
      where: { id: parentId },
      select: { id: true },
    });

    if (!parent) {
      return NextResponse.json({ message: "Type parent introuvable" }, { status: 404 });
    }
  }

  const data = await prisma.$transaction(async (tx) => {
    const updatedType = await tx.typeUniteOrganisationnelle.update({
      where: { id },
      data: {
        nom: body.nom,
        code: body.code,
        description: body.description ?? null,
        parentId: parentId ?? null,
        ordre: Number(body.ordre ?? 0),
        actif: body.actif ?? true,
        systeme: body.systeme ?? undefined,
      },
    });

    if (provinceId) {
      const template = await tx.typeOrgaUniteProvince.findFirst({
        where: {
          typeUniteId: id,
          provinceId,
          uniteOrganisationnelleId: null,
        },
        select: { id: true },
      });

      if (!template) {
        await tx.typeOrgaUniteProvince.create({
          data: {
            typeUniteId: id,
            provinceId,
            uniteOrganisationnelleId: null,
            actif: true,
          },
        });
      }
    }

    return tx.typeUniteOrganisationnelle.findUnique({
      where: { id: updatedType.id },
      include: {
        parent: {
          select: { id: true, nom: true, code: true, parentId: true },
        },
        enfants: {
          select: { id: true, nom: true, code: true, parentId: true },
        },
        typeOrgaUniteProvinces: {
          where: provinceId ? { provinceId } : undefined,
          select: {
            id: true,
            provinceId: true,
            uniteOrganisationnelleId: true,
            actif: true,
            province: {
              select: { id: true, code: true, nom: true },
            },
            uniteOrganisationnelle: {
              select: { id: true, nom: true, code: true, parentId: true, niveau: true },
            },
          },
        },
      },
    });
  });

  return NextResponse.json({ data }, { status: 200 });
}

export async function DELETE(req: Request) {
  const guard = await ensureTypeUniteAccess("type_unite_organisationnelle.delete");
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const id = parseOptionalInt(body?.id);

  if (!id) {
    return NextResponse.json({ message: "id invalide" }, { status: 400 });
  }

  const existing = await prisma.typeUniteOrganisationnelle.findUnique({
    where: { id },
    select: {
      id: true,
      systeme: true,
      _count: {
        select: { typeOrgaUniteProvinces: true },
      },
    },
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

  const usedInMappings = await prisma.typeOrgaUniteProvince.count({
    where: {
      typeUniteId: id,
      OR: [{ uniteOrganisationnelleId: { not: null } }, { affectations: { some: {} } }],
    },
  });

  if (usedInMappings > 0) {
    return NextResponse.json(
      {
        message:
          "Ce type est deja utilise par des unites, des provinces ou des affectations.",
      },
      { status: 400 }
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.typeOrgaUniteProvince.deleteMany({ where: { typeUniteId: id } });
    await tx.typeUniteOrganisationnelle.delete({ where: { id } });
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
