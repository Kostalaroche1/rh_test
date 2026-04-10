import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import {
  CanalRappelPlanification,
  CiblePlanification,
  RoleParticipantPlanification,
} from "@/generated/prisma";
import {
  canAccessAgentForPermissions,
  canAccessProvinceForPermissions,
  canAccessUnitForPermissions,
  getAccessibleAgentIdsForPermissions,
  getScopedProvinceIdsForPermissions,
  getScopedUnitIdsForPermissions,
} from "@/server/access/scope";
import { notifyPlanificationChange } from "@/server/services/notification.service";

type ScopePermission =
  | "planification.read"
  | "planification.create"
  | "planification.update"
  | "planification.delete";

type ManualPlanificationStatus =
  | "BROUILLON"
  | "PLANIFIE"
  | "ANNULE"
  | "REPORTE";

function normalizeStoredStatus(value: unknown): ManualPlanificationStatus {
  switch (value) {
    case "BROUILLON":
    case "ANNULE":
    case "REPORTE":
      return value;
    default:
      return "PLANIFIE";
  }
}

function getEffectivePlanificationStatus(params: {
  statut: string;
  dateDebut: Date | string;
  dateFin?: Date | string | null;
}) {
  const { statut, dateDebut, dateFin } = params;

  if (statut === "BROUILLON" || statut === "ANNULE" || statut === "REPORTE") {
    return statut;
  }

  const start = new Date(dateDebut);
  if (Number.isNaN(start.getTime())) {
    return statut;
  }

  const end = dateFin ? new Date(dateFin) : new Date(start);
  if (Number.isNaN(end.getTime())) {
    end.setTime(start.getTime());
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const now = new Date();

  if (now < start) {
    return "PLANIFIE";
  }

  if (now <= end) {
    return "EN_COURS";
  }

  return "TERMINE";
}

function withEffectivePlanificationStatus<T extends { statut: string; dateDebut: Date | string; dateFin?: Date | string | null }>(
  item: T
) {
  return {
    ...item,
    statut: getEffectivePlanificationStatus({
      statut: item.statut,
      dateDebut: item.dateDebut,
      dateFin: item.dateFin ?? null,
    }),
  };
}

const TYPE_TARGET_RULES: Partial<
  Record<string, CiblePlanification[]>
> = {
  CONGE: [CiblePlanification.INDIVIDUEL],
  ENTRETIEN: [CiblePlanification.INDIVIDUEL],
  AFFECTATION: [CiblePlanification.INDIVIDUEL],
  JOUR_FERIE: [
    CiblePlanification.UNITE,
    CiblePlanification.PROVINCE,
    CiblePlanification.TOUTE_ORGANISATION,
  ],
};

async function ensurePlanificationAccess(permission: ScopePermission) {
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

function normalizeParticipantInput(value: unknown): Array<{
  agentId: number;
  roleDansPlan?: RoleParticipantPlanification;
  obligatoire?: boolean;
}> {
  if (!Array.isArray(value)) {
    return [];
  }

  const allowedRoles = new Set<RoleParticipantPlanification>([
    RoleParticipantPlanification.BENEFICIAIRE,
    RoleParticipantPlanification.RESPONSABLE,
    RoleParticipantPlanification.SUPERVISEUR,
    RoleParticipantPlanification.INTERVENANT,
  ]);

  return value
    .map((item) => ({
      agentId: Number((item as any)?.agentId),
      roleDansPlan: allowedRoles.has((item as any)?.roleDansPlan)
        ? (item as any).roleDansPlan
        : undefined,
      obligatoire: (item as any)?.obligatoire,
    }))
    .filter((item) => Number.isFinite(item.agentId));
}

function normalizeReminderInput(value: unknown): Array<{
  dateRappel: string;
  canal?: CanalRappelPlanification;
  message?: string | null;
  envoye?: boolean;
}> {
  if (!Array.isArray(value)) {
    return [];
  }

  const allowedCanaux = new Set<CanalRappelPlanification>([
    CanalRappelPlanification.APP,
    CanalRappelPlanification.EMAIL,
    CanalRappelPlanification.SMS,
  ]);

  return value
    .map((item) => ({
      dateRappel: String((item as any)?.dateRappel ?? ""),
      canal: allowedCanaux.has((item as any)?.canal)
        ? (item as any).canal
        : undefined,
      message: (item as any)?.message ?? null,
      envoye: (item as any)?.envoye,
    }))
    .filter((item) => item.dateRappel.trim().length > 0);
}

function normalizeCible(value: unknown): CiblePlanification {
  const allowed = new Set<CiblePlanification>([
    CiblePlanification.INDIVIDUEL,
    CiblePlanification.UNITE,
    CiblePlanification.PROVINCE,
    CiblePlanification.TOUTE_ORGANISATION,
  ]);

  return allowed.has(value as CiblePlanification)
    ? (value as CiblePlanification)
    : CiblePlanification.INDIVIDUEL;
}

async function validateParticipantsAccess(
  utilisateurId: number,
  participants: Array<{ agentId: number }>
) {
  for (const participant of participants) {
    const canAccessAgent = await canAccessAgentForPermissions(
      utilisateurId,
      participant.agentId,
      ["planification.create", "planification.update", "agent.read"]
    );

    if (!canAccessAgent) {
      return false;
    }
  }

  return true;
}

async function validateTargetAccess(
  utilisateurId: number,
  cible: CiblePlanification,
  uniteOrganisationnelleId: number | null,
  provinceId: number | null,
  permission: ScopePermission
) {
  if (cible === CiblePlanification.UNITE && uniteOrganisationnelleId) {
    return canAccessUnitForPermissions(utilisateurId, uniteOrganisationnelleId, [
      permission,
      "unite_organisationnelle.read",
    ]);
  }

  if (cible === CiblePlanification.PROVINCE && provinceId) {
    return canAccessProvinceForPermissions(utilisateurId, provinceId, [
      permission,
      "province.read",
    ]);
  }

  return true;
}

async function validatePlanificationPayload(params: {
  utilisateurId: number;
  typePlanificationId: number;
  cible: CiblePlanification;
  uniteOrganisationnelleId: number | null;
  provinceId: number | null;
  demandeCongeId: number | null;
  affectationId: number | null;
  participants: Array<{ agentId: number }>;
  permission: "planification.create" | "planification.update";
}) {
  const {
    utilisateurId,
    typePlanificationId,
    cible,
    uniteOrganisationnelleId,
    provinceId,
    demandeCongeId,
    affectationId,
    participants,
    permission,
  } = params;

  const typePlanification = await prisma.typePlanification.findUnique({
    where: { id: typePlanificationId },
    select: { id: true, code: true, actif: true },
  });

  if (!typePlanification || !typePlanification.actif) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "Type de planification introuvable ou inactif." },
        { status: 400 }
      ),
    };
  }

  if (cible === CiblePlanification.INDIVIDUEL && participants.length === 0) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          message:
            "Selectionnez au moins un participant pour une planification individuelle.",
        },
        { status: 400 }
      ),
    };
  }

  if (cible !== CiblePlanification.INDIVIDUEL && participants.length > 0) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          message:
            "Les participants individuels ne s'appliquent pas a une planification collective.",
        },
        { status: 400 }
      ),
    };
  }

  if (cible === CiblePlanification.UNITE && !uniteOrganisationnelleId) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "Selectionnez une unite pour cette planification." },
        { status: 400 }
      ),
    };
  }

  if (cible === CiblePlanification.PROVINCE && !provinceId) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { message: "Selectionnez une province pour cette planification." },
        { status: 400 }
      ),
    };
  }

  if (
    typePlanification.code === "JOUR_FERIE" &&
    cible === CiblePlanification.INDIVIDUEL
  ) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          message:
            "Un jour ferie doit cibler une unite, une province ou toute l'organisation.",
        },
        { status: 400 }
      ),
    };
  }

  const allowedTargets = TYPE_TARGET_RULES[typePlanification.code];
  if (allowedTargets && !allowedTargets.includes(cible)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          message: `Le type ${typePlanification.code} n'autorise pas cette cible.`,
        },
        { status: 400 }
      ),
    };
  }

  if (demandeCongeId && typePlanification.code !== "CONGE") {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          message:
            "Une demande de conge liee n'est autorisee que pour le type CONGE.",
        },
        { status: 400 }
      ),
    };
  }

  if (affectationId && typePlanification.code !== "AFFECTATION") {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          message:
            "Une affectation liee n'est autorisee que pour le type AFFECTATION.",
        },
        { status: 400 }
      ),
    };
  }

  const canAccessTarget = await validateTargetAccess(
    utilisateurId,
    cible,
    uniteOrganisationnelleId,
    provinceId,
    permission
  );

  if (!canAccessTarget) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: "Acces refuse" }, { status: 403 }),
    };
  }

  if (participants.length > 0) {
    const canAccessParticipants = await validateParticipantsAccess(
      utilisateurId,
      participants
    );
    if (!canAccessParticipants) {
      return {
        ok: false as const,
        response: NextResponse.json({ message: "Acces refuse" }, { status: 403 }),
      };
    }
  }

  return { ok: true as const, typePlanification };
}

async function ensureNoDuplicateHolidayPlanification(params: {
  planificationId?: number;
  typeCode: string;
  dateDebut: string;
  dateFin: string | null;
  cible: CiblePlanification;
  uniteOrganisationnelleId: number | null;
  provinceId: number | null;
}) {
  const {
    planificationId,
    typeCode,
    dateDebut,
    dateFin,
    cible,
    uniteOrganisationnelleId,
    provinceId,
  } = params;

  if (typeCode !== "JOUR_FERIE") {
    return { ok: true as const };
  }

  const duplicate = await prisma.planification.findFirst({
    where: {
      ...(planificationId ? { id: { not: planificationId } } : {}),
      typePlanification: {
        code: "JOUR_FERIE",
      },
      dateDebut: new Date(dateDebut),
      dateFin: dateFin ? new Date(dateFin) : null,
      cible,
      uniteOrganisationnelleId:
        cible === CiblePlanification.UNITE ? uniteOrganisationnelleId : null,
      provinceId: cible === CiblePlanification.PROVINCE ? provinceId : null,
    },
    select: {
      id: true,
      titre: true,
    },
  });

  if (duplicate) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          message:
            "Un jour ferie existe deja pour la meme periode et la meme cible. Modifiez l'entree existante ou changez les dates.",
        },
        { status: 409 }
      ),
    };
  }

  return { ok: true as const };
}

export async function GET() {
  const guard = await ensurePlanificationAccess("planification.read");
  if (!guard.ok) return guard.response;

  const accessibleAgentIds = await getAccessibleAgentIdsForPermissions(
    guard.auth!.userId,
    ["planification.read"]
  );
  const scopedUnitIds = await getScopedUnitIdsForPermissions(
    guard.auth!.userId,
    ["planification.read"]
  );
  const scopedProvinceIds = await getScopedProvinceIdsForPermissions(
    guard.auth!.userId,
    ["planification.read", "province.read"]
  );

  const where =
    scopedUnitIds === null &&
    accessibleAgentIds === null &&
    scopedProvinceIds === null
      ? undefined
      : {
          OR: [
            { cible: CiblePlanification.TOUTE_ORGANISATION },
            ...(scopedUnitIds === null
              ? []
              : [
                  {
                    cible: CiblePlanification.UNITE,
                    uniteOrganisationnelleId: {
                      in: scopedUnitIds.length ? scopedUnitIds : [-1],
                    },
                  },
                ]),
            ...(scopedProvinceIds === null
              ? []
              : [
                  {
                    cible: CiblePlanification.PROVINCE,
                    provinceId: {
                      in: scopedProvinceIds.length ? scopedProvinceIds : [-1],
                    },
                  },
                ]),
            ...(accessibleAgentIds === null
              ? []
              : [
                  {
                    cible: CiblePlanification.INDIVIDUEL,
                    participants: {
                      some: {
                        agentId: {
                          in: accessibleAgentIds.length ? accessibleAgentIds : [-1],
                        },
                      },
                    },
                  },
                ]),
          ],
        };

  const data = await prisma.planification.findMany({
    where,
    include: {
      typePlanification: true,
      uniteOrganisationnelle: {
        select: { id: true, nom: true, code: true },
      },
      province: {
        select: { id: true, nom: true, code: true },
      },
      creePar: {
        select: { id: true, login: true },
      },
      assignePar: {
        select: { id: true, login: true },
      },
      validePar: {
        select: { id: true, login: true },
      },
      demandeConge: {
        select: { id: true, statut: true, dateDebut: true, dateFin: true },
      },
      affectation: {
        select: { id: true, agentId: true, typeOrgaUniteProvinceId: true, dateDebut: true, dateFin: true },
      },
      participants: {
        include: {
          agent: {
            select: {
              id: true,
              matricule: true,
              nom: true,
              prenom: true,
            },
          },
        },
      },
      rappels: true,
    },
    orderBy: [{ dateDebut: "asc" }, { titre: "asc" }],
  });

  return NextResponse.json(
    { data: data.map((item) => withEffectivePlanificationStatus(item)) },
    { status: 200 }
  );
}

export async function POST(req: Request) {
  const guard = await ensurePlanificationAccess("planification.create");
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const cible = normalizeCible(body.cible);
  const uniteOrganisationnelleId = body.uniteOrganisationnelleId
    ? Number(body.uniteOrganisationnelleId)
    : null;
  const provinceId = body.provinceId ? Number(body.provinceId) : null;
  const demandeCongeId = body.demandeCongeId ? Number(body.demandeCongeId) : null;
  const affectationId = body.affectationId ? Number(body.affectationId) : null;
  const participants = normalizeParticipantInput(body.participants);
  const rappels = normalizeReminderInput(body.rappels);

  const payloadValidation = await validatePlanificationPayload({
    utilisateurId: guard.auth!.userId,
    typePlanificationId: Number(body.typePlanificationId),
    cible,
    uniteOrganisationnelleId,
    provinceId,
    demandeCongeId,
    affectationId,
    participants,
    permission: "planification.create",
  });
  if (!payloadValidation.ok) return payloadValidation.response;
  const duplicateGuard = await ensureNoDuplicateHolidayPlanification({
    typeCode: payloadValidation.typePlanification.code,
    dateDebut: body.dateDebut,
    dateFin: body.dateFin ?? null,
    cible,
    uniteOrganisationnelleId,
    provinceId,
  });
  if (!duplicateGuard.ok) return duplicateGuard.response;

  const data = await prisma.planification.create({
    data: {
      titre: body.titre,
      description: body.description ?? null,
      typePlanificationId: Number(body.typePlanificationId),
      dateDebut: new Date(body.dateDebut),
      dateFin: body.dateFin ? new Date(body.dateFin) : null,
      statut: normalizeStoredStatus(body.statut),
      priorite: body.priorite ?? "NORMALE",
      cible,
      uniteOrganisationnelleId:
        cible === CiblePlanification.UNITE ? uniteOrganisationnelleId : null,
      provinceId: cible === CiblePlanification.PROVINCE ? provinceId : null,
      creeParId: guard.auth!.userId,
      assigneParId: body.assigneParId ? Number(body.assigneParId) : null,
      valideParId: body.valideParId ? Number(body.valideParId) : null,
      dateValidation: body.dateValidation ? new Date(body.dateValidation) : null,
      demandeCongeId,
      affectationId,
      notes: body.notes ?? null,
      participants:
        participants.length > 0
          ? {
              createMany: {
                data: participants.map((participant) => ({
                  agentId: participant.agentId,
                  roleDansPlan:
                    participant.roleDansPlan ??
                    RoleParticipantPlanification.BENEFICIAIRE,
                  obligatoire: participant.obligatoire ?? true,
                })),
              },
            }
          : undefined,
      rappels:
        rappels.length > 0
          ? {
              createMany: {
                data: rappels.map((rappel) => ({
                  dateRappel: new Date(rappel.dateRappel),
                  canal: rappel.canal ?? CanalRappelPlanification.APP,
                  message: rappel.message ?? null,
                  envoye: rappel.envoye ?? false,
                })),
              },
            }
          : undefined,
    },
    include: {
      typePlanification: true,
      uniteOrganisationnelle: {
        select: { id: true, nom: true },
      },
      province: {
        select: { id: true, nom: true },
      },
      participants: true,
      rappels: true,
    },
  });

  try {
    await notifyPlanificationChange({
      event: "create",
      planificationId: data.id,
      typeCode: data.typePlanification.code,
      titre: data.titre,
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
      cible: data.cible,
      uniteOrganisationnelleId: data.uniteOrganisationnelleId,
      provinceId: data.provinceId,
      uniteNom: data.uniteOrganisationnelle?.nom ?? null,
      provinceNom: data.province?.nom ?? null,
      participantAgentIds: participants.map((participant) => participant.agentId),
    });
  } catch (error) {
    console.error("Planification notification failed on create:", error);
  }

  return NextResponse.json(
    { data: withEffectivePlanificationStatus(data) },
    { status: 201 }
  );
}

export async function PUT(req: Request) {
  const guard = await ensurePlanificationAccess("planification.update");
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const id = Number(body.id);
  const cible = normalizeCible(body.cible);
  const uniteOrganisationnelleId = body.uniteOrganisationnelleId
    ? Number(body.uniteOrganisationnelleId)
    : null;
  const provinceId = body.provinceId ? Number(body.provinceId) : null;
  const participants = normalizeParticipantInput(body.participants);
  const rappels = normalizeReminderInput(body.rappels);

  const existing = await prisma.planification.findUnique({
    where: { id },
    select: {
      id: true,
      cible: true,
      uniteOrganisationnelleId: true,
      provinceId: true,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { message: "Planification introuvable" },
      { status: 404 }
    );
  }

  const canAccessExistingTarget = await validateTargetAccess(
    guard.auth!.userId,
    existing.cible,
    existing.uniteOrganisationnelleId,
    existing.provinceId,
    "planification.update"
  );
  if (!canAccessExistingTarget) {
    return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
  }

  const payloadValidation = await validatePlanificationPayload({
    utilisateurId: guard.auth!.userId,
    typePlanificationId: Number(body.typePlanificationId),
    cible,
    uniteOrganisationnelleId,
    provinceId,
    demandeCongeId: body.demandeCongeId ? Number(body.demandeCongeId) : null,
    affectationId: body.affectationId ? Number(body.affectationId) : null,
    participants,
    permission: "planification.update",
  });
  if (!payloadValidation.ok) return payloadValidation.response;
  const duplicateGuard = await ensureNoDuplicateHolidayPlanification({
    planificationId: id,
    typeCode: payloadValidation.typePlanification.code,
    dateDebut: body.dateDebut,
    dateFin: body.dateFin ?? null,
    cible,
    uniteOrganisationnelleId,
    provinceId,
  });
  if (!duplicateGuard.ok) return duplicateGuard.response;

  const data = await prisma.planification.update({
    where: { id },
    data: {
      titre: body.titre,
      description: body.description ?? null,
      typePlanificationId: Number(body.typePlanificationId),
      dateDebut: new Date(body.dateDebut),
      dateFin: body.dateFin ? new Date(body.dateFin) : null,
      statut: normalizeStoredStatus(body.statut),
      priorite: body.priorite ?? "NORMALE",
      cible,
      uniteOrganisationnelleId:
        cible === CiblePlanification.UNITE ? uniteOrganisationnelleId : null,
      provinceId: cible === CiblePlanification.PROVINCE ? provinceId : null,
      assigneParId: body.assigneParId ? Number(body.assigneParId) : null,
      valideParId: body.valideParId ? Number(body.valideParId) : null,
      dateValidation: body.dateValidation ? new Date(body.dateValidation) : null,
      demandeCongeId: body.demandeCongeId ? Number(body.demandeCongeId) : null,
      affectationId: body.affectationId ? Number(body.affectationId) : null,
      notes: body.notes ?? null,
      participants: {
        deleteMany: {},
        ...(participants.length > 0
          ? {
              createMany: {
                data: participants.map((participant) => ({
                  agentId: participant.agentId,
                  roleDansPlan:
                    participant.roleDansPlan ??
                    RoleParticipantPlanification.BENEFICIAIRE,
                  obligatoire: participant.obligatoire ?? true,
                })),
              },
            }
          : {}),
      },
      rappels: {
        deleteMany: {},
        ...(rappels.length > 0
          ? {
              createMany: {
                data: rappels.map((rappel) => ({
                  dateRappel: new Date(rappel.dateRappel),
                  canal: rappel.canal ?? CanalRappelPlanification.APP,
                  message: rappel.message ?? null,
                  envoye: rappel.envoye ?? false,
                })),
              },
            }
          : {}),
      },
    },
    include: {
      typePlanification: true,
      uniteOrganisationnelle: {
        select: { id: true, nom: true },
      },
      province: {
        select: { id: true, nom: true },
      },
      participants: true,
      rappels: true,
    },
  });

  try {
    await notifyPlanificationChange({
      event: "update",
      planificationId: data.id,
      typeCode: data.typePlanification.code,
      titre: data.titre,
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
      cible: data.cible,
      uniteOrganisationnelleId: data.uniteOrganisationnelleId,
      provinceId: data.provinceId,
      uniteNom: data.uniteOrganisationnelle?.nom ?? null,
      provinceNom: data.province?.nom ?? null,
      participantAgentIds: participants.map((participant) => participant.agentId),
    });
  } catch (error) {
    console.error("Planification notification failed on update:", error);
  }

  return NextResponse.json(
    { data: withEffectivePlanificationStatus(data) },
    { status: 200 }
  );
}

export async function DELETE(req: Request) {
  const guard = await ensurePlanificationAccess("planification.delete");
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const id = Number(body.id);

  const existing = await prisma.planification.findUnique({
    where: { id },
    select: {
      id: true,
      cible: true,
      uniteOrganisationnelleId: true,
      provinceId: true,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { message: "Planification introuvable" },
      { status: 404 }
    );
  }

  const canAccessExistingTarget = await validateTargetAccess(
    guard.auth!.userId,
    existing.cible,
    existing.uniteOrganisationnelleId,
    existing.provinceId,
    "planification.delete"
  );
  if (!canAccessExistingTarget) {
    return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
  }

  await prisma.planification.delete({
    where: { id },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
