import prisma from "@/lib/prisma";
import type { SessionUser } from "@/security/auth";
import { CiblePlanification } from "@/generated/prisma";

type BaseNotificationPayload = {
  titre: string;
  message: string;
  type?: string;
  url?: string | null;
  icon?: string;
  expediteur?: string;
};

type UniqueNotificationPayload = BaseNotificationPayload & {
  compteId?: number | null;
  dedupeHours?: number;
};

async function resolveRoleIds(keys: string[]) {
  if (!keys.length) return [];
  const roles = await prisma.role.findMany({
    where: {
      OR: [
        { key: { in: keys } },
        { code: { in: keys } },
        { rolePermission: { some: { permission: { code: { in: keys } } } } },
      ],
    },
    select: { id: true },
  });
  return [...new Set(roles.map((role) => role.id))];
}

async function resolveCompteIdsForRoleIds(roleIds: number[]) {
  if (!roleIds.length) return [];

  const assignments = await prisma.utilisateurRole.findMany({
    where: {
      roleId: { in: roleIds },
      role: { actif: true },
      utilisateur: {
        actif: true,
        compteAgent: {
          isNot: null,
        },
      },
    },
    select: {
      utilisateur: {
        select: {
          compteAgent: {
            select: { id: true },
          },
        },
      },
    },
  });

  return [
    ...new Set(
      assignments
        .map((item) => item.utilisateur.compteAgent?.id ?? null)
        .filter((value): value is number => Number.isFinite(value))
    ),
  ];
}

async function resolveCompteIdsForRoleKeys(keys: string[]) {
  const roleIds = await resolveRoleIds(keys);
  return resolveCompteIdsForRoleIds(roleIds);
}

async function resolveCompteIdsForAgentIds(agentIds: number[]) {
  if (!agentIds.length) return [];

  const comptes = await prisma.compteAgent.findMany({
    where: {
      agentId: { in: agentIds },
      utilisateur: { actif: true },
    },
    select: { id: true },
  });

  return [...new Set(comptes.map((compte) => compte.id))];
}

async function resolveCompteIdsForUnit(unitId: number) {
  const affectations = await prisma.affectation.findMany({
    where: {
      actif: true,
      principale: true,
      agent: {
        compte: {
          isNot: null,
        },
      },
      typeOrgaUniteProvince: {
        uniteOrganisationnelleId: unitId,
      },
    },
    select: {
      agent: {
        select: {
          compte: {
            select: { id: true },
          },
        },
      },
    },
  });

  return [
    ...new Set(
      affectations
        .map((item) => item.agent.compte?.id ?? null)
        .filter((value): value is number => Number.isFinite(value))
    ),
  ];
}

async function resolveCompteIdsForProvince(provinceId: number) {
  const affectations = await prisma.affectation.findMany({
    where: {
      actif: true,
      principale: true,
      agent: {
        compte: {
          isNot: null,
        },
      },
      typeOrgaUniteProvince: {
        provinceId,
      },
    },
    select: {
      agent: {
        select: {
          compte: {
            select: { id: true },
          },
        },
      },
    },
  });

  return [
    ...new Set(
      affectations
        .map((item) => item.agent.compte?.id ?? null)
        .filter((value): value is number => Number.isFinite(value))
    ),
  ];
}

async function resolveAllActiveCompteIds() {
  const comptes = await prisma.compteAgent.findMany({
    where: {
      utilisateur: { actif: true },
    },
    select: { id: true },
  });

  return [...new Set(comptes.map((compte) => compte.id))];
}

export async function createNotification(
  payload: BaseNotificationPayload & {
    compteId?: number | null;
  }
) {
  return prisma.notification.create({
    data: {
      compteId: payload.compteId ?? null,
      roleId: null,
      titre: payload.titre,
      message: payload.message,
      type: payload.type ?? "INFO",
      url: payload.url ?? null,
      icon: payload.icon ?? "bell",
      statut: "NON_LU",
      expedider: payload.expediteur ?? "SYSTEM",
      dateEnvoi: new Date(),
    },
  });
}

export async function createUniqueNotification(payload: UniqueNotificationPayload) {
  const dedupeHours = payload.dedupeHours ?? 24;
  const since = new Date(Date.now() - dedupeHours * 60 * 60 * 1000);

  const existing = await prisma.notification.findFirst({
    where: {
      compteId: payload.compteId ?? null,
      roleId: null,
      titre: payload.titre,
      message: payload.message,
      dateEnvoi: { gte: since },
    },
    select: { id: true },
  });

  if (existing) return existing;
  return createNotification(payload);
}

export async function notifyRoles(roleKeys: string[], payload: BaseNotificationPayload) {
  const compteIds = await resolveCompteIdsForRoleKeys(roleKeys);
  if (!compteIds.length) return;

  await Promise.all(
    compteIds.map((compteId) =>
      createNotification({
        ...payload,
        compteId,
      })
    )
  );
}

export async function notifyCompteAndRoles(
  compteId: number | null | undefined,
  roleKeys: string[],
  payload: BaseNotificationPayload
) {
  const compteIds = new Set<number>();

  if (compteId) {
    compteIds.add(compteId);
  }

  const roleCompteIds = await resolveCompteIdsForRoleKeys(roleKeys);
  for (const id of roleCompteIds) {
    compteIds.add(id);
  }

  if (!compteIds.size) {
    return;
  }

  await Promise.all(
    [...compteIds].map((id) =>
      createNotification({
        ...payload,
        compteId: id,
      })
    )
  );
}

export async function notifyLogin(user: SessionUser) {
  await notifyRoles(["user.read", "notification.read"], {
    titre: "Nouvelle connexion",
    message: `${user.nom ?? "Utilisateur"} ${user.prenom ?? ""} vient de se connecter.`,
    type: "SECURITY",
    url: "/dashboard",
    icon: "log-in",
  });
}

export async function notifyAffectationExpiry(options: {
  affectationId: number;
  agentLabel: string;
  dateFin: Date;
}) {
  const message = `L'affectation #${options.affectationId} de ${options.agentLabel} arrive a echeance le ${options.dateFin.toLocaleDateString("fr-FR")}.`;
  const compteIds = await resolveCompteIdsForRoleKeys(["affectation.read", "notification.read"]);

  await Promise.all([
    createUniqueNotification({
      titre: "Echeance d'affectation",
      message,
      compteId: null,
      dedupeHours: 24,
    }),
    ...compteIds.map((compteId) =>
      createUniqueNotification({
        titre: "Echeance d'affectation",
        message,
        compteId,
        dedupeHours: 24,
      })
    ),
  ]);
}

function formatPlanificationPeriod(dateDebut: Date, dateFin?: Date | null) {
  const start = dateDebut.toLocaleDateString("fr-FR");
  if (!dateFin) return start;

  const end = dateFin.toLocaleDateString("fr-FR");
  return start === end ? start : `${start} au ${end}`;
}

function formatPlanificationTarget(options: {
  cible: CiblePlanification;
  uniteNom?: string | null;
  provinceNom?: string | null;
}) {
  switch (options.cible) {
    case CiblePlanification.UNITE:
      return options.uniteNom
        ? `pour l'unite ${options.uniteNom}`
        : "pour une unite";
    case CiblePlanification.PROVINCE:
      return options.provinceNom
        ? `pour la province ${options.provinceNom}`
        : "pour une province";
    case CiblePlanification.TOUTE_ORGANISATION:
      return "pour toute l'organisation";
    default:
      return "pour les participants concernes";
  }
}

export async function notifyPlanificationChange(options: {
  event: "create" | "update";
  planificationId: number;
  typeCode: string;
  titre: string;
  dateDebut: Date;
  dateFin?: Date | null;
  cible: CiblePlanification;
  uniteOrganisationnelleId?: number | null;
  provinceId?: number | null;
  uniteNom?: string | null;
  provinceNom?: string | null;
  participantAgentIds?: number[];
}) {
  const participantAgentIds = options.participantAgentIds ?? [];
  const impactedCompteIds = new Set<number>();

  if (
    options.cible === CiblePlanification.INDIVIDUEL &&
    participantAgentIds.length > 0
  ) {
    const ids = await resolveCompteIdsForAgentIds(participantAgentIds);
    ids.forEach((id) => impactedCompteIds.add(id));
  } else if (
    options.cible === CiblePlanification.UNITE &&
    options.uniteOrganisationnelleId
  ) {
    const ids = await resolveCompteIdsForUnit(options.uniteOrganisationnelleId);
    ids.forEach((id) => impactedCompteIds.add(id));
  } else if (
    options.cible === CiblePlanification.PROVINCE &&
    options.provinceId
  ) {
    const ids = await resolveCompteIdsForProvince(options.provinceId);
    ids.forEach((id) => impactedCompteIds.add(id));
  } else if (options.cible === CiblePlanification.TOUTE_ORGANISATION) {
    const ids = await resolveAllActiveCompteIds();
    ids.forEach((id) => impactedCompteIds.add(id));
  }

  const monitoringCompteIds = await resolveCompteIdsForRoleKeys([
    "admin",
    "rh",
    "notification.read",
  ]);
  monitoringCompteIds.forEach((id) => impactedCompteIds.add(id));

  if (!impactedCompteIds.size) {
    return;
  }

  const isHoliday = options.typeCode === "JOUR_FERIE";
  const titre =
    options.event === "create"
      ? isHoliday
        ? "Nouveau jour ferie"
        : "Nouvelle planification RH"
      : isHoliday
      ? "Jour ferie mis a jour"
      : "Planification RH mise a jour";
  const period = formatPlanificationPeriod(options.dateDebut, options.dateFin);
  const target = formatPlanificationTarget({
    cible: options.cible,
    uniteNom: options.uniteNom,
    provinceNom: options.provinceNom,
  });
  const message = `${options.titre} est ${options.event === "create" ? "planifie" : "mis a jour"} ${target} sur la periode du ${period}.`;

  await Promise.all(
    [...impactedCompteIds].map((compteId) =>
      createUniqueNotification({
        compteId,
        titre,
        message,
        type: isHoliday ? "JOUR_FERIE" : "PLANIFICATION",
        url: "/dashboard/planification",
        icon: isHoliday ? "calendar-off" : "calendar-clock",
        dedupeHours: 12,
      })
    )
  );
}
