import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import {
  canAccessProvinceForPermissions,
  canAccessUnitForPermissions,
  getScopedUnitIdsForPermissions,
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

function mapLinkToUnitRow(link: {
  id: number;
  typeUniteId: number;
  uniteOrganisationnelleId: number | null;
  provinceId: number;
  actif: boolean;
  typeUnite: { id: number; nom: string; code: string; parentId: number | null };
  province: { id: number; nom: string; code: string };
  uniteOrganisationnelle: {
    id: number;
    nom: string;
    code: string;
    description: string | null;
    parentId: number | null;
    niveau: number;
    actif: boolean;
    parent: { id: number; nom: string; code: string } | null;
    _count: { enfants: number; postes: number };
  } | null;
  _count: { affectations: number };
}) {
  if (!link.uniteOrganisationnelle) {
    return null;
  }

  return {
    id: link.uniteOrganisationnelle.id,
    mappingId: link.id,
    typeOrgaUniteProvinceId: link.id,
    nom: link.uniteOrganisationnelle.nom,
    code: link.uniteOrganisationnelle.code,
    description: link.uniteOrganisationnelle.description,
    parentId: link.uniteOrganisationnelle.parentId,
    parent: link.uniteOrganisationnelle.parent,
    niveau: link.uniteOrganisationnelle.niveau,
    actif: link.uniteOrganisationnelle.actif && link.actif,
    uniteActif: link.uniteOrganisationnelle.actif,
    mappingActif: link.actif,
    typeUniteId: link.typeUniteId,
    provinceId: link.provinceId,
    typeUnite: link.typeUnite,
    province: link.province,
    _count: {
      enfants: link.uniteOrganisationnelle._count.enfants,
      postes: link.uniteOrganisationnelle._count.postes,
      affectations: link._count.affectations,
    },
  };
}

export async function GET(req: Request) {
  const guard = await ensureUniteAccess("unite_organisationnelle.read");
  if (!guard.ok) return guard.response;

  const { searchParams } = new URL(req.url);
  const provinceId = parseOptionalInt(searchParams.get("provinceId"));
  const typeUniteId = parseOptionalInt(searchParams.get("typeUniteId"));

  const scopedUnitIds = await getScopedUnitIdsForPermissions(
    guard.auth!.userId,
    ["unite_organisationnelle.read"]
  );

  const links = await prisma.typeOrgaUniteProvince.findMany({
    where: {
      actif: true,
      uniteOrganisationnelleId: { not: null },
      ...(Number.isFinite(provinceId) && provinceId ? { provinceId } : {}),
      ...(Number.isFinite(typeUniteId) && typeUniteId ? { typeUniteId } : {}),
      ...(scopedUnitIds === null
        ? {}
        : {
            uniteOrganisationnelleId: {
              in: scopedUnitIds.length ? scopedUnitIds : [-1],
            },
          }),
    },
    include: {
      typeUnite: {
        select: { id: true, nom: true, code: true, parentId: true },
      },
      province: {
        select: { id: true, nom: true, code: true },
      },
      uniteOrganisationnelle: {
        include: {
          parent: {
            select: { id: true, nom: true, code: true },
          },
          _count: {
            select: { enfants: true, postes: true },
          },
        },
      },
      _count: {
        select: { affectations: true },
      },
    },
    orderBy: [{ provinceId: "asc" }, { typeUniteId: "asc" }, { id: "asc" }],
  });

  const data = links
    .map((item) => mapLinkToUnitRow(item))
    .filter(Boolean)
    .sort((a: any, b: any) => {
      if (a.niveau !== b.niveau) return a.niveau - b.niveau;
      return String(a.nom).localeCompare(String(b.nom));
    });

  return NextResponse.json({ data }, { status: 200 });
}

export async function POST(req: Request) {
  const guard = await ensureUniteAccess("unite_organisationnelle.create");
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const provinceId = parseOptionalInt(body?.provinceId);
  const typeUniteId = parseOptionalInt(body?.typeUniteId);
  const parentId = parseOptionalInt(body?.parentId);
  const uniteExistanteId = parseOptionalInt(body?.uniteExistanteId);

  if (!provinceId || !typeUniteId) {
    return NextResponse.json(
      { message: "Province et type d'unite sont obligatoires." },
      { status: 400 }
    );
  }

  const canAccessProvince = await canAccessProvinceForPermissions(
    guard.auth!.userId,
    provinceId,
    ["unite_organisationnelle.create", "province.read"]
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

  const type = await prisma.typeUniteOrganisationnelle.findUnique({
    where: { id: typeUniteId },
    select: { id: true },
  });

  if (!type) {
    return NextResponse.json({ message: "Type d'unite introuvable" }, { status: 404 });
  }

  if (parentId) {
    const canAccessParent = await canAccessUnitForPermissions(
      guard.auth!.userId,
      parentId,
      ["unite_organisationnelle.read", "unite_organisationnelle.create"]
    );
    if (!canAccessParent) {
      return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
    }

    const parent = await prisma.uniteOrganisationnelle.findUnique({
      where: { id: parentId },
      select: { id: true },
    });

    if (!parent) {
      return NextResponse.json({ message: "Unite parente introuvable" }, { status: 404 });
    }
  }

  if (uniteExistanteId) {
    const canAccessExistingUnit = await canAccessUnitForPermissions(
      guard.auth!.userId,
      uniteExistanteId,
      ["unite_organisationnelle.read", "unite_organisationnelle.create"]
    );
    if (!canAccessExistingUnit) {
      return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
    }
  }

  let createdNewUnit = false;
  let data: any = null;
  try {
    data = await prisma.$transaction(async (tx) => {
      let uniteId = uniteExistanteId;

      if (uniteId) {
        const existingUnit = await tx.uniteOrganisationnelle.findUnique({
          where: { id: uniteId },
          select: { id: true },
        });

        if (!existingUnit) {
          throw new Error("UNITE_EXISTANTE_INTROUVABLE");
        }
      } else {
        if (!body?.nom || !body?.code) {
          throw new Error("NOM_CODE_OBLIGATOIRES");
        }

        const createdUnit = await tx.uniteOrganisationnelle.create({
          data: {
            nom: body.nom,
            code: body.code,
            description: body.description ?? null,
            parentId: parentId ?? null,
            actif: body.actif ?? true,
          },
          select: { id: true },
        });

        uniteId = createdUnit.id;
        createdNewUnit = true;
      }

      const duplicate = await tx.typeOrgaUniteProvince.findFirst({
        where: {
          typeUniteId,
          provinceId,
          uniteOrganisationnelleId: uniteId as number,
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new Error("LIEN_DEJA_EXISTANT");
      }

      const template = await tx.typeOrgaUniteProvince.findFirst({
        where: {
          typeUniteId,
          provinceId,
          uniteOrganisationnelleId: null,
        },
        select: { id: true },
        orderBy: { id: "asc" },
      });

      const link = template
        ? await tx.typeOrgaUniteProvince.update({
            where: { id: template.id },
            data: {
              uniteOrganisationnelleId: uniteId as number,
              actif: body.actif ?? true,
            },
          })
        : await tx.typeOrgaUniteProvince.create({
            data: {
              typeUniteId,
              provinceId,
              uniteOrganisationnelleId: uniteId as number,
              actif: body.actif ?? true,
            },
          });

      return tx.typeOrgaUniteProvince.findUnique({
        where: { id: link.id },
        include: {
          typeUnite: {
            select: { id: true, nom: true, code: true, parentId: true },
          },
          province: {
            select: { id: true, nom: true, code: true },
          },
          uniteOrganisationnelle: {
            include: {
              parent: { select: { id: true, nom: true, code: true } },
              _count: {
                select: { enfants: true, postes: true },
              },
            },
          },
          _count: {
            select: { affectations: true },
          },
        },
      });
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNITE_EXISTANTE_INTROUVABLE") {
        return NextResponse.json({ message: "Unite existante introuvable." }, { status: 404 });
      }
      if (error.message === "NOM_CODE_OBLIGATOIRES") {
        return NextResponse.json(
          { message: "Nom et code sont obligatoires pour creer une nouvelle unite." },
          { status: 400 }
        );
      }
      if (error.message === "LIEN_DEJA_EXISTANT") {
        return NextResponse.json(
          { message: "Cette unite est deja rattachee a ce type et cette province." },
          { status: 409 }
        );
      }
    }
    throw error;
  }

  if (createdNewUnit) {
    await rebuildOrganisationPaths();
  }

  return NextResponse.json({ data: mapLinkToUnitRow(data as any) }, { status: 201 });
}

export async function PUT(req: Request) {
  const guard = await ensureUniteAccess("unite_organisationnelle.update");
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const mappingId = parseOptionalInt(body?.mappingId ?? body?.id);
  const provinceId = parseOptionalInt(body?.provinceId);
  const typeUniteId = parseOptionalInt(body?.typeUniteId);
  const parentId = parseOptionalInt(body?.parentId);

  if (!mappingId) {
    return NextResponse.json({ message: "mappingId invalide" }, { status: 400 });
  }

  const existingLink = await prisma.typeOrgaUniteProvince.findUnique({
    where: { id: mappingId },
    select: {
      id: true,
      typeUniteId: true,
      provinceId: true,
      uniteOrganisationnelleId: true,
    },
  });

  if (!existingLink || !existingLink.uniteOrganisationnelleId) {
    return NextResponse.json({ message: "Lien unite/type/province introuvable" }, { status: 404 });
  }

  const canAccessUnit = await canAccessUnitForPermissions(
    guard.auth!.userId,
    existingLink.uniteOrganisationnelleId,
    ["unite_organisationnelle.update", "unite_organisationnelle.read"]
  );

  if (!canAccessUnit) {
    return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
  }

  const resolvedProvinceId = provinceId ?? existingLink.provinceId;
  const resolvedTypeUniteId = typeUniteId ?? existingLink.typeUniteId;

  const canAccessProvince = await canAccessProvinceForPermissions(
    guard.auth!.userId,
    resolvedProvinceId,
    ["unite_organisationnelle.update", "province.read"]
  );

  if (!canAccessProvince) {
    return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
  }

  if (parentId) {
    const canAccessParent = await canAccessUnitForPermissions(
      guard.auth!.userId,
      parentId,
      ["unite_organisationnelle.read", "unite_organisationnelle.update"]
    );
    if (!canAccessParent) {
      return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
    }

    const parent = await prisma.uniteOrganisationnelle.findUnique({
      where: { id: parentId },
      select: { id: true },
    });

    if (!parent) {
      return NextResponse.json({ message: "Unite parente introuvable" }, { status: 404 });
    }
  }

  const duplicate = await prisma.typeOrgaUniteProvince.findFirst({
    where: {
      id: { not: mappingId },
      typeUniteId: resolvedTypeUniteId,
      provinceId: resolvedProvinceId,
      uniteOrganisationnelleId: existingLink.uniteOrganisationnelleId,
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json(
      { message: "Cette unite est deja rattachee a ce type et cette province." },
      { status: 409 }
    );
  }

  const data = await prisma.$transaction(async (tx) => {
    await tx.uniteOrganisationnelle.update({
      where: { id: existingLink.uniteOrganisationnelleId as number },
      data: {
        nom: body.nom,
        code: body.code,
        description: body.description ?? null,
        parentId: parentId ?? null,
        actif: body.uniteActif ?? body.actif ?? true,
      },
    });

    await tx.typeOrgaUniteProvince.update({
      where: { id: mappingId },
      data: {
        typeUniteId: resolvedTypeUniteId,
        provinceId: resolvedProvinceId,
        actif: body.mappingActif ?? body.actif ?? true,
      },
    });

    return tx.typeOrgaUniteProvince.findUnique({
      where: { id: mappingId },
      include: {
        typeUnite: {
          select: { id: true, nom: true, code: true, parentId: true },
        },
        province: {
          select: { id: true, nom: true, code: true },
        },
        uniteOrganisationnelle: {
          include: {
            parent: { select: { id: true, nom: true, code: true } },
            _count: {
              select: { enfants: true, postes: true },
            },
          },
        },
        _count: {
          select: { affectations: true },
        },
      },
    });
  });

  await rebuildOrganisationPaths();

  return NextResponse.json({ data: mapLinkToUnitRow(data as any) }, { status: 200 });
}

export async function DELETE(req: Request) {
  const guard = await ensureUniteAccess("unite_organisationnelle.delete");
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const mappingId = parseOptionalInt(body?.mappingId ?? body?.id);

  if (!mappingId) {
    return NextResponse.json({ message: "mappingId invalide" }, { status: 400 });
  }

  const existingLink = await prisma.typeOrgaUniteProvince.findUnique({
    where: { id: mappingId },
    select: {
      id: true,
      uniteOrganisationnelleId: true,
      _count: {
        select: { affectations: true },
      },
    },
  });

  if (!existingLink) {
    return NextResponse.json({ message: "Lien introuvable" }, { status: 404 });
  }

  if ((existingLink._count?.affectations ?? 0) > 0) {
    return NextResponse.json(
      { message: "Ce lien est deja utilise par des affectations et ne peut pas etre supprime." },
      { status: 400 }
    );
  }

  if (existingLink.uniteOrganisationnelleId) {
    const canAccessUnit = await canAccessUnitForPermissions(
      guard.auth!.userId,
      existingLink.uniteOrganisationnelleId,
      ["unite_organisationnelle.delete", "unite_organisationnelle.read"]
    );

    if (!canAccessUnit) {
      return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.typeOrgaUniteProvince.delete({
      where: { id: mappingId },
    });

    if (!existingLink.uniteOrganisationnelleId) {
      return;
    }

    const remainingLinks = await tx.typeOrgaUniteProvince.count({
      where: { uniteOrganisationnelleId: existingLink.uniteOrganisationnelleId },
    });

    if (remainingLinks > 0) {
      return;
    }

    const unit = await tx.uniteOrganisationnelle.findUnique({
      where: { id: existingLink.uniteOrganisationnelleId },
      select: {
        _count: {
          select: { enfants: true, postes: true },
        },
      },
    });

    if (!unit) {
      return;
    }

    if ((unit._count?.enfants ?? 0) > 0 || (unit._count?.postes ?? 0) > 0) {
      return;
    }

    await tx.uniteOrganisationnelle.delete({
      where: { id: existingLink.uniteOrganisationnelleId },
    });
  });

  await rebuildOrganisationPaths();

  return NextResponse.json({ success: true }, { status: 200 });
}
