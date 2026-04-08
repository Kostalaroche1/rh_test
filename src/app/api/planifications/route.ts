import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import {
  CanalRappelPlanification,
  RoleParticipantPlanification,
} from "@/generated/prisma";
import {
  canAccessAgentForPermissions,
  canAccessUnitForPermissions,
  getAccessibleAgentIdsForPermissions,
  getScopedUnitIdsForPermissions,
} from "@/server/access/scope";

type ScopePermission = "planification.read" | "planification.create" | "planification.update" | "planification.delete";

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

  return value
    .map((item) => ({
      agentId: Number((item as any)?.agentId),
      roleDansPlan: (item as any)?.roleDansPlan,
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

  return value
    .map((item) => ({
      dateRappel: String((item as any)?.dateRappel ?? ""),
      canal: (item as any)?.canal,
      message: (item as any)?.message ?? null,
      envoye: (item as any)?.envoye,
    }))
    .filter((item) => item.dateRappel.trim().length > 0);
}

async function validateParticipantsAccess(
  utilisateurId: number,
  participants: Array<{ agentId: number }>
) {
  for (const participant of participants) {
    const canAccessAgent = await canAccessAgentForPermissions(utilisateurId, participant.agentId, [
      "planification.create",
      "planification.update",
      "agent.read",
    ]);

    if (!canAccessAgent) {
      return false;
    }
  }

  return true;
}

export async function GET() {
  const guard = await ensurePlanificationAccess("planification.read");
  if (!guard.ok) return guard.response;

  const accessibleAgentIds = await getAccessibleAgentIdsForPermissions(guard.auth!.userId, [
    "planification.read",
  ]);
  const scopedUnitIds = await getScopedUnitIdsForPermissions(guard.auth!.userId, [
    "planification.read",
  ]);

  const where =
    scopedUnitIds === null && accessibleAgentIds === null
      ? undefined
      : {
          OR: [
            ...(scopedUnitIds === null
              ? []
              : [{ uniteOrganisationnelleId: { in: scopedUnitIds.length ? scopedUnitIds : [-1] } }]),
            ...(accessibleAgentIds === null
              ? []
              : [
                  {
                    participants: {
                      some: {
                        agentId: { in: accessibleAgentIds.length ? accessibleAgentIds : [-1] },
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

  return NextResponse.json({ data }, { status: 200 });
}

export async function POST(req: Request) {
  const guard = await ensurePlanificationAccess("planification.create");
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const uniteOrganisationnelleId = body.uniteOrganisationnelleId ? Number(body.uniteOrganisationnelleId) : null;
  const demandeCongeId = body.demandeCongeId ? Number(body.demandeCongeId) : null;
  const affectationId = body.affectationId ? Number(body.affectationId) : null;
  const participants = normalizeParticipantInput(body.participants);
  const rappels = normalizeReminderInput(body.rappels);

  if (uniteOrganisationnelleId) {
    const canAccessUnit = await canAccessUnitForPermissions(
      guard.auth!.userId,
      uniteOrganisationnelleId,
      ["planification.create", "unite_organisationnelle.read"]
    );

    if (!canAccessUnit) {
      return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
    }
  }

  const canAccessParticipants = await validateParticipantsAccess(guard.auth!.userId, participants);
  if (!canAccessParticipants) {
    return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
  }

  const data = await prisma.planification.create({
    data: {
      titre: body.titre,
      description: body.description ?? null,
      typePlanificationId: Number(body.typePlanificationId),
      dateDebut: new Date(body.dateDebut),
      dateFin: body.dateFin ? new Date(body.dateFin) : null,
      statut: body.statut ?? "BROUILLON",
      priorite: body.priorite ?? "NORMALE",
      uniteOrganisationnelleId,
      creeParId: guard.auth!.userId,
      assigneParId: body.assigneParId ? Number(body.assigneParId) : null,
      valideParId: body.valideParId ? Number(body.valideParId) : null,
      dateValidation: body.dateValidation ? new Date(body.dateValidation) : null,
      demandeCongeId,
      affectationId,
      notes: body.notes ?? null,
      participants: participants.length
        ? {
            create: participants.map((participant) => ({
              agentId: participant.agentId,
              roleDansPlan: participant.roleDansPlan ?? RoleParticipantPlanification.BENEFICIAIRE,
              obligatoire: participant.obligatoire ?? true,
            })),
          }
        : undefined,
      rappels: rappels.length
        ? {
            create: rappels.map((rappel) => ({
              dateRappel: new Date(rappel.dateRappel),
              canal: rappel.canal ?? CanalRappelPlanification.APP,
              message: rappel.message ?? null,
              envoye: rappel.envoye ?? false,
            })),
          }
        : undefined,
    },
    include: {
      typePlanification: true,
      participants: true,
      rappels: true,
    },
  });

  return NextResponse.json({ data }, { status: 201 });
}

export async function PUT(req: Request) {
  const guard = await ensurePlanificationAccess("planification.update");
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const id = Number(body.id);
  const uniteOrganisationnelleId = body.uniteOrganisationnelleId ? Number(body.uniteOrganisationnelleId) : null;
  const participants = normalizeParticipantInput(body.participants);
  const rappels = normalizeReminderInput(body.rappels);

  const existing = await prisma.planification.findUnique({
    where: { id },
    select: {
      id: true,
      uniteOrganisationnelleId: true,
      participants: { select: { agentId: true } },
    },
  });

  if (!existing) {
    return NextResponse.json({ message: "Planification introuvable" }, { status: 404 });
  }

  if (existing.uniteOrganisationnelleId) {
    const canAccessCurrentUnit = await canAccessUnitForPermissions(
      guard.auth!.userId,
      existing.uniteOrganisationnelleId,
      ["planification.update", "planification.read"]
    );

    if (!canAccessCurrentUnit) {
      return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
    }
  }

  if (uniteOrganisationnelleId) {
    const canAccessTargetUnit = await canAccessUnitForPermissions(
      guard.auth!.userId,
      uniteOrganisationnelleId,
      ["planification.update", "unite_organisationnelle.read"]
    );

    if (!canAccessTargetUnit) {
      return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
    }
  }

  const canAccessParticipants = await validateParticipantsAccess(guard.auth!.userId, participants);
  if (!canAccessParticipants) {
    return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
  }

  const data = await prisma.planification.update({
    where: { id },
    data: {
      titre: body.titre,
      description: body.description ?? null,
      typePlanificationId: Number(body.typePlanificationId),
      dateDebut: new Date(body.dateDebut),
      dateFin: body.dateFin ? new Date(body.dateFin) : null,
      statut: body.statut ?? "BROUILLON",
      priorite: body.priorite ?? "NORMALE",
      uniteOrganisationnelleId,
      assigneParId: body.assigneParId ? Number(body.assigneParId) : null,
      valideParId: body.valideParId ? Number(body.valideParId) : null,
      dateValidation: body.dateValidation ? new Date(body.dateValidation) : null,
      demandeCongeId: body.demandeCongeId ? Number(body.demandeCongeId) : null,
      affectationId: body.affectationId ? Number(body.affectationId) : null,
      notes: body.notes ?? null,
      participants: {
        deleteMany: {},
        create: participants.map((participant) => ({
          agentId: participant.agentId,
          roleDansPlan: participant.roleDansPlan ?? RoleParticipantPlanification.BENEFICIAIRE,
          obligatoire: participant.obligatoire ?? true,
        })),
      },
      rappels: {
        deleteMany: {},
        create: rappels.map((rappel) => ({
          dateRappel: new Date(rappel.dateRappel),
          canal: rappel.canal ?? CanalRappelPlanification.APP,
          message: rappel.message ?? null,
          envoye: rappel.envoye ?? false,
        })),
      },
    },
    include: {
      typePlanification: true,
      participants: true,
      rappels: true,
    },
  });

  return NextResponse.json({ data }, { status: 200 });
}

export async function DELETE(req: Request) {
  const guard = await ensurePlanificationAccess("planification.delete");
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const id = Number(body.id);

  const existing = await prisma.planification.findUnique({
    where: { id },
    select: { id: true, uniteOrganisationnelleId: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "Planification introuvable" }, { status: 404 });
  }

  if (existing.uniteOrganisationnelleId) {
    const canAccessUnit = await canAccessUnitForPermissions(
      guard.auth!.userId,
      existing.uniteOrganisationnelleId,
      ["planification.delete", "planification.read"]
    );

    if (!canAccessUnit) {
      return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
    }
  }

  await prisma.planification.delete({
    where: { id },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
