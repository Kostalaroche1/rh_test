import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
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

async function resolveTypeOrgaUniteProvinceId(body: any) {
  const directId = parseOptionalInt(body?.typeOrgaUniteProvinceId);
  if (directId) return directId;

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

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    await requireAccess({ permissions: ["affectation.assign"] });
    const body = await req.json();

    const agentId = parseOptionalInt(body?.agentId);
    const posteId = parseOptionalInt(body?.posteId);
    const gradeId = parseOptionalInt(body?.gradeId);
    const fonctionId = parseOptionalInt(body?.fonctionId);
    const typeOrgaUniteProvinceId = await resolveTypeOrgaUniteProvinceId(body);

    if (!agentId || !posteId || !gradeId || !typeOrgaUniteProvinceId) {
      return NextResponse.json(
        { error: "agent, poste, grade et lien type/unite/province sont obligatoires" },
        { status: 400 }
      );
    }

    if (!(await canAccessAgentForPermissions(auth.userId, agentId, ["affectation.assign"]))) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const link = await prisma.typeOrgaUniteProvince.findUnique({
      where: { id: typeOrgaUniteProvinceId },
      select: { id: true, uniteOrganisationnelleId: true },
    });

    if (!link || !link.uniteOrganisationnelleId) {
      return NextResponse.json({ error: "Lien type/unite/province introuvable" }, { status: 404 });
    }

    if (
      !(await canAccessUnitForPermissions(auth.userId, link.uniteOrganisationnelleId, [
        "unite_organisationnelle.read",
        "affectation.assign",
      ]))
    ) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const affectation = await prisma.affectation.create({
      data: {
        agentId,
        posteId,
        fonctionId,
        gradeId,
        typeOrgaUniteProvinceId,
        dateDebut: body.dateDebut ? new Date(body.dateDebut) : new Date(),
        dateFin: body.dateFin ? new Date(body.dateFin) : null,
        motif: body.motif ?? null,
        type: body.type ?? "AFFECTATION",
        typeContrat: body.typeContrat ?? null,
        statutContrat: body.statutContrat ?? null,
        statut: body.statut ?? "EN_ATTENTE",
      },
      include: {
        agent: true,
        poste: true,
        grade: true,
        fonction: true,
        typeOrgaUniteProvince: {
          include: {
            typeUnite: true,
            uniteOrganisationnelle: true,
            province: true,
          },
        },
      },
    });

    return NextResponse.json(affectation);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await requireAccess({ permissions: ["affectation.read", "agent.read"] });
    const auth = await import("@/security/auth").then((m) => m.getAuthenticatedUser());
    if (!auth) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const accessibleAgentIds = await getAccessibleAgentIdsForPermissions(auth.userId, [
      "agent.read",
      "affectation.read",
    ]);

    const carrieres = await prisma.agent.findMany({
      where:
        accessibleAgentIds === null
          ? undefined
          : accessibleAgentIds.length
          ? { id: { in: accessibleAgentIds } }
          : { id: -1 },
      select: {
        actif: true,
        matricule: true,
        nom: true,
        photo: true,
        statut: true,
        genre: true,
        datenais: true,
        id: true,
        dateEntree: true,
        affectations: {
          select: {
            id: true,
            agentId: true,
            fonctionId: true,
            gradeId: true,
            posteId: true,
            typeOrgaUniteProvinceId: true,
            typeOrgaUniteProvince: {
              select: {
                typeUnite: {
                  select: { id: true, nom: true, code: true },
                },
                uniteOrganisationnelle: {
                  select: { id: true, nom: true, code: true, parentId: true },
                },
                province: { select: { id: true, code: true, nom: true } },
              },
            },
            poste: { select: { libelle: true } },
            fonction: { select: { libelle: true } },
            grade: { select: { libelle: true } },
            dateDebut: true,
            dateFin: true,
            type: true,
            statut: true,
            typeContrat: true,
            statutContrat: true,
          },
        },
      },
    });

    const data = carrieres.map((agent) => ({
      ...agent,
      affectations: (agent.affectations ?? []).map((item) => ({
        ...item,
        typeUnite: item.typeOrgaUniteProvince?.typeUnite ?? null,
        uniteOrganisationnelle: item.typeOrgaUniteProvince?.uniteOrganisationnelle ?? null,
        province: item.typeOrgaUniteProvince?.province ?? null,
      })),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
