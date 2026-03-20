import prisma from "@/lib/prisma";
import type { SessionUser } from "@/security/auth";

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
