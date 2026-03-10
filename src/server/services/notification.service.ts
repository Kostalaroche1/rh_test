import prisma from "@/lib/prisma";
import type { SessionUser } from "@/security/auth";
import { ROLE_KEYS } from "@/security/roles";

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
  roleId?: number | null;
  dedupeHours?: number;
};

async function resolveRoleIds(keys: string[]) {
  if (!keys.length) return [];
  const roles = await prisma.role.findMany({
    where: { key: { in: keys } },
    select: { id: true, key: true },
  });
  return roles.map((role) => role.id);
}

export async function createNotification(
  payload: BaseNotificationPayload & {
    compteId?: number | null;
    roleId?: number | null;
  }
) {
  return prisma.notification.create({
    data: {
      compteId: payload.compteId ?? null,
      roleId: payload.roleId ?? null,
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

export async function createUniqueNotification(
  payload: UniqueNotificationPayload
) {
  const dedupeHours = payload.dedupeHours ?? 24;
  const since = new Date(Date.now() - dedupeHours * 60 * 60 * 1000);

  const existing = await prisma.notification.findFirst({
    where: {
      compteId: payload.compteId ?? null,
      roleId: payload.roleId ?? null,
      titre: payload.titre,
      message: payload.message,
      dateEnvoi: { gte: since },
    },
    select: { id: true },
  });

  if (existing) return existing;
  return createNotification(payload);
}

export async function notifyRoles(
  roleKeys: string[],
  payload: BaseNotificationPayload
) {
  const roleIds = await resolveRoleIds(roleKeys);
  if (!roleIds.length) return;

  await Promise.all(
    roleIds.map((roleId) =>
      createNotification({
        ...payload,
        roleId,
      })
    )
  );
}

export async function notifyCompteAndRoles(
  compteId: number | null | undefined,
  roleKeys: string[],
  payload: BaseNotificationPayload
) {
  const jobs: Promise<unknown>[] = [];

  if (compteId) {
    jobs.push(
      createNotification({
        ...payload,
        compteId,
      })
    );
  }

  const roleIds = await resolveRoleIds(roleKeys);
  for (const roleId of roleIds) {
    jobs.push(
      createNotification({
        ...payload,
        roleId,
      })
    );
  }

  if (jobs.length) {
    await Promise.all(jobs);
  }
}

export async function notifyLogin(user: SessionUser) {
  await notifyRoles([ROLE_KEYS.ADMIN, ROLE_KEYS.RH], {
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
  await Promise.all([
    createUniqueNotification({
      titre: "Echeance d'affectation",
      message,
      roleId: null,
      compteId: null,
      dedupeHours: 24,
    }),
    ...(
      await resolveRoleIds([ROLE_KEYS.ADMIN, ROLE_KEYS.RH])
    ).map((roleId) =>
      createUniqueNotification({
        titre: "Echeance d'affectation",
        message,
        roleId,
        dedupeHours: 24,
      })
    ),
  ]);
}

