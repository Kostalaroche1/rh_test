import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import { notifyCompteAndRoles } from "@/server/services/notification.service";
import {
  canAccessAgentForPermissions,
  canAccessUnitForPermissions,
  getAccessibleAgentIdsForPermissions,
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

async function ensureAffectationAccess(permission: string) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: "Non autorise" }, { status: 401 }),
      auth: null,
    };
  }
  try {
    await requireAccess({
      permissions: [permission],
    });
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json({ message: "Acces refuse" }, { status: 403 }),
      auth: null,
    };
  }
  return { ok: true as const, auth };
}

async function resolveTypeOrgaUniteProvinceId(body: any) {
  const directId = parseOptionalInt(body?.typeOrgaUniteProvinceId);
  if (directId) {
    return directId;
  }

  const typeUniteId = parseOptionalInt(body?.typeUniteId);
  const uniteOrganisationnelleId = parseOptionalInt(body?.uniteOrganisationnelleId);
  const provinceId = parseOptionalInt(body?.provinceId);

  if (!typeUniteId || !uniteOrganisationnelleId || !provinceId) {
    return null;
  }

  const link = await prisma.typeOrgaUniteProvince.findFirst({
    where: {
      typeUniteId,
      uniteOrganisationnelleId,
      provinceId,
      actif: true,
    },
    select: { id: true },
  });

  return link?.id ?? null;
}

export async function GET() {
  const guard = await ensureAffectationAccess("affectation.read");
  if (!guard.ok) return guard.response;

  const accessibleAgentIds = await getAccessibleAgentIdsForPermissions(guard.auth!.userId, [
    "affectation.read",
  ]);

  const rows = await prisma.affectation.findMany({
    where:
      accessibleAgentIds === null
        ? undefined
        : {
            agentId: { in: accessibleAgentIds.length ? accessibleAgentIds : [-1] },
          },
    include: {
      agent: true,
      poste: true,
      fonction: true,
      grade: true,
      typeOrgaUniteProvince: {
        include: {
          typeUnite: true,
          province: true,
          uniteOrganisationnelle: true,
        },
      },
      historique: true,
      affectationOrigine: {
        select: { id: true, dateDebut: true, dateFin: true, type: true },
      },
    },
    orderBy: { dateDebut: "desc" },
  });

  const data = rows.map((row) => ({
    ...row,
    typeUnite: row.typeOrgaUniteProvince?.typeUnite ?? null,
    province: row.typeOrgaUniteProvince?.province ?? null,
    uniteOrganisationnelle: row.typeOrgaUniteProvince?.uniteOrganisationnelle ?? null,
  }));

  return NextResponse.json({ data }, { status: 200 });
}

export async function POST(req: Request) {
  const guard = await ensureAffectationAccess("affectation.assign");
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const agentId = parseOptionalInt(body?.agentId);
  const posteId = parseOptionalInt(body?.posteId);
  const gradeId = parseOptionalInt(body?.gradeId);
  const fonctionId = parseOptionalInt(body?.fonctionId);
  const affectationOrigineId = parseOptionalInt(body?.affectationOrigineId);

  if (!agentId || !posteId || !gradeId) {
    return NextResponse.json(
      { message: "agentId, posteId et gradeId sont obligatoires." },
      { status: 400 }
    );
  }

  if (!(await canAccessAgentForPermissions(guard.auth!.userId, agentId, ["affectation.assign"]))) {
    return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
  }

  const typeOrgaUniteProvinceId = await resolveTypeOrgaUniteProvinceId(body);
  if (!typeOrgaUniteProvinceId) {
    return NextResponse.json(
      { message: "Le lien type/unite/province est obligatoire." },
      { status: 400 }
    );
  }

  const link = await prisma.typeOrgaUniteProvince.findUnique({
    where: { id: typeOrgaUniteProvinceId },
    include: {
      typeUnite: true,
      province: true,
      uniteOrganisationnelle: true,
    },
  });

  if (!link || !link.uniteOrganisationnelleId || !link.uniteOrganisationnelle) {
    return NextResponse.json(
      { message: "Le lien type/unite/province est introuvable ou incomplet." },
      { status: 404 }
    );
  }

  const canAccessUnit = await canAccessUnitForPermissions(
    guard.auth!.userId,
    link.uniteOrganisationnelleId,
    ["unite_organisationnelle.read", "affectation.assign"]
  );

  if (!canAccessUnit) {
    return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
  }

  if (body.type === "INTERIM" && !body.dateFin) {
    return NextResponse.json(
      { message: "Une affectation temporaire (INTERIM) doit avoir une date de fin." },
      { status: 400 }
    );
  }

  if (affectationOrigineId) {
    const origine = await prisma.affectation.findUnique({
      where: { id: affectationOrigineId },
      select: { id: true, agentId: true },
    });

    if (!origine) {
      return NextResponse.json({ message: "Affectation d'origine introuvable." }, { status: 404 });
    }

    if (origine.agentId !== agentId) {
      return NextResponse.json(
        { message: "L'affectation d'origine doit appartenir au meme agent." },
        { status: 400 }
      );
    }
  }

  const isTemporary = body.type === "INTERIM";
  const startDate = body.dateDebut ? new Date(body.dateDebut) : new Date();
  const endDate = body.dateFin ? new Date(body.dateFin) : null;

  if (endDate && endDate < startDate) {
    return NextResponse.json(
      { message: "La date de fin doit etre superieure ou egale a la date de debut." },
      { status: 400 }
    );
  }

  const data = await prisma.$transaction(async (tx) => {
    if (!isTemporary) {
      const active = await tx.affectation.findFirst({
        where: {
          agentId,
          principale: true,
          actif: true,
          statut: { not: "REJETE" },
          OR: [{ dateFin: null }, { dateFin: { gte: startDate } }],
        },
        orderBy: [{ dateDebut: "desc" }],
      });

      if (active) {
        const closeDate = new Date(startDate);
        closeDate.setDate(closeDate.getDate() - 1);

        await tx.affectation.update({
          where: { id: active.id },
          data: {
            dateFin: closeDate,
            principale: false,
            statutOrganisationnel: "TERMINEE",
          },
        });
      }
    }

    const created = await tx.affectation.create({
      data: {
        agentId,
        posteId,
        fonctionId,
        gradeId,
        typeOrgaUniteProvinceId,
        dateDebut: startDate,
        dateFin: endDate,
        motif: body.motif ?? null,
        type: body.type ?? "AFFECTATION",
        typeContrat: body.typeContrat ?? null,
        statutContrat: body.statutContrat ?? null,
        statut: body.statut ?? "EN_ATTENTE",
        principale: isTemporary ? false : body.principale ?? true,
        actif: body.actif ?? true,
        affectationOrigineId: affectationOrigineId ?? null,
        statutOrganisationnel:
          endDate && endDate < new Date() ? "TERMINEE" : body.statutOrganisationnel ?? "ACTIVE",
      },
      include: {
        agent: {
          include: {
            compte: { select: { id: true } },
          },
        },
        poste: true,
        grade: true,
        fonction: true,
        typeOrgaUniteProvince: {
          include: {
            typeUnite: true,
            province: true,
            uniteOrganisationnelle: true,
          },
        },
      },
    });

    await tx.historiqueAffectation.create({
      data: {
        affectationId: created.id,
        ancienPoste: null,
        nouveauPoste: created.poste?.libelle ?? null,
        ancienGrade: null,
        nouveauGrade: created.grade?.libelle ?? null,
        motif: created.motif ?? "Creation d'affectation",
      },
    });

    return created;
  });

  await notifyCompteAndRoles(data.agent?.compte?.id ?? null, ["admin", "rh"], {
    titre: "Nouvelle affectation",
    message: `${data.agent.nom} ${data.agent.prenom} est affecte(e) a ${data.poste?.libelle ?? "un poste"} (${data.typeOrgaUniteProvince?.uniteOrganisationnelle?.nom ?? "-"})`,
    type: "AFFECTATION",
    icon: "briefcase",
    url: "/dashboard/organisation",
  });

  return NextResponse.json(
    {
      data: {
        ...data,
        typeUnite: data.typeOrgaUniteProvince?.typeUnite ?? null,
        province: data.typeOrgaUniteProvince?.province ?? null,
        uniteOrganisationnelle: data.typeOrgaUniteProvince?.uniteOrganisationnelle ?? null,
      },
    },
    { status: 201 }
  );
}

export async function PUT(req: Request) {
  const guard = await ensureAffectationAccess("affectation.update");
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const id = parseOptionalInt(body?.id);

  if (!id) {
    return NextResponse.json({ message: "id invalide" }, { status: 400 });
  }

  const existing = await prisma.affectation.findUnique({
    where: { id },
    select: { id: true, agentId: true, typeOrgaUniteProvinceId: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "Affectation introuvable" }, { status: 404 });
  }

  if (!(await canAccessAgentForPermissions(guard.auth!.userId, existing.agentId, ["affectation.update"]))) {
    return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
  }

  const typeOrgaUniteProvinceId =
    (await resolveTypeOrgaUniteProvinceId(body)) ?? existing.typeOrgaUniteProvinceId;

  const link = await prisma.typeOrgaUniteProvince.findUnique({
    where: { id: typeOrgaUniteProvinceId },
    include: { uniteOrganisationnelle: true },
  });

  if (!link || !link.uniteOrganisationnelleId) {
    return NextResponse.json(
      { message: "Le lien type/unite/province est introuvable ou incomplet." },
      { status: 404 }
    );
  }

  const canAccessUnit = await canAccessUnitForPermissions(
    guard.auth!.userId,
    link.uniteOrganisationnelleId,
    ["unite_organisationnelle.read", "affectation.update"]
  );

  if (!canAccessUnit) {
    return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
  }

  if (body.type === "INTERIM" && !body.dateFin) {
    return NextResponse.json(
      { message: "Une affectation temporaire (INTERIM) doit avoir une date de fin." },
      { status: 400 }
    );
  }

  const startDate = body.dateDebut ? new Date(body.dateDebut) : undefined;
  const endDate = body.dateFin ? new Date(body.dateFin) : null;

  if (startDate && endDate && endDate < startDate) {
    return NextResponse.json(
      { message: "La date de fin doit etre superieure ou egale a la date de debut." },
      { status: 400 }
    );
  }

  const data = await prisma.affectation.update({
    where: { id },
    data: {
      posteId: parseOptionalInt(body.posteId) ?? undefined,
      fonctionId: parseOptionalInt(body.fonctionId),
      gradeId: parseOptionalInt(body.gradeId) ?? undefined,
      typeOrgaUniteProvinceId,
      dateDebut: startDate,
      dateFin: endDate,
      motif: body.motif ?? null,
      type: body.type ?? "AFFECTATION",
      typeContrat: body.typeContrat ?? null,
      statutContrat: body.statutContrat ?? null,
      statut: body.statut ?? undefined,
      principale: body.principale ?? undefined,
      actif: body.actif ?? undefined,
      statutOrganisationnel: body.statutOrganisationnel ?? undefined,
      affectationOrigineId: parseOptionalInt(body.affectationOrigineId),
    },
    include: {
      agent: {
        include: {
          compte: { select: { id: true } },
        },
      },
      poste: true,
      typeOrgaUniteProvince: {
        include: {
          typeUnite: true,
          province: true,
          uniteOrganisationnelle: true,
        },
      },
    },
  });

  await notifyCompteAndRoles(data.agent?.compte?.id ?? null, ["admin", "rh"], {
    titre: "Affectation modifiee",
    message: `Le parcours de ${data.agent.nom} ${data.agent.prenom} a ete mis a jour (${data.poste?.libelle ?? "poste"}).`,
    type: "AFFECTATION",
    icon: "refresh-cw",
    url: "/dashboard/organisation",
  });

  return NextResponse.json(
    {
      data: {
        ...data,
        typeUnite: data.typeOrgaUniteProvince?.typeUnite ?? null,
        province: data.typeOrgaUniteProvince?.province ?? null,
        uniteOrganisationnelle: data.typeOrgaUniteProvince?.uniteOrganisationnelle ?? null,
      },
    },
    { status: 200 }
  );
}

export async function DELETE(req: Request) {
  const guard = await ensureAffectationAccess("affectation.delete");
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const id = parseOptionalInt(body?.id);

  if (!id) {
    return NextResponse.json({ message: "id invalide" }, { status: 400 });
  }

  const existing = await prisma.affectation.findUnique({
    where: { id },
    select: { agentId: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "Affectation introuvable" }, { status: 404 });
  }

  if (!(await canAccessAgentForPermissions(guard.auth!.userId, existing.agentId, ["affectation.delete"]))) {
    return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
  }

  await prisma.affectation.delete({
    where: { id },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
