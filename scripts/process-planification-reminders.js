const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient();

async function resolveRoleIds(keys) {
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

async function resolveCompteIdsForRoleKeys(keys) {
  const roleIds = await resolveRoleIds(keys);
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
        .filter((value) => Number.isFinite(value))
    ),
  ];
}

async function resolveCompteIdsForAgentIds(agentIds) {
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

async function resolveCompteIdsForUnit(unitId) {
  const affectations = await prisma.affectation.findMany({
    where: {
      actif: true,
      principale: true,
      agent: {
        compte: { isNot: null },
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
        .filter((value) => Number.isFinite(value))
    ),
  ];
}

async function resolveCompteIdsForProvince(provinceId) {
  const affectations = await prisma.affectation.findMany({
    where: {
      actif: true,
      principale: true,
      agent: {
        compte: { isNot: null },
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
        .filter((value) => Number.isFinite(value))
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

async function resolveReminderRecipients(reminder) {
  const planification = reminder.planification;
  const compteIds = new Set();

  if (planification.cible === "INDIVIDUEL") {
    const agentIds = (planification.participants || []).map((item) => item.agentId);
    const ids = await resolveCompteIdsForAgentIds(agentIds);
    ids.forEach((id) => compteIds.add(id));
  } else if (planification.cible === "UNITE" && planification.uniteOrganisationnelleId) {
    const ids = await resolveCompteIdsForUnit(planification.uniteOrganisationnelleId);
    ids.forEach((id) => compteIds.add(id));
  } else if (planification.cible === "PROVINCE" && planification.provinceId) {
    const ids = await resolveCompteIdsForProvince(planification.provinceId);
    ids.forEach((id) => compteIds.add(id));
  } else if (planification.cible === "TOUTE_ORGANISATION") {
    const ids = await resolveAllActiveCompteIds();
    ids.forEach((id) => compteIds.add(id));
  }

  const monitoringIds = await resolveCompteIdsForRoleKeys(["admin", "rh", "notification.read"]);
  monitoringIds.forEach((id) => compteIds.add(id));

  return [...compteIds];
}

function formatPeriod(planification) {
  const start = new Date(planification.dateDebut).toLocaleDateString("fr-FR");
  const end = planification.dateFin
    ? new Date(planification.dateFin).toLocaleDateString("fr-FR")
    : null;

  if (!end || end === start) {
    return start;
  }

  return `${start} au ${end}`;
}

function buildReminderNotification(reminder) {
  const planification = reminder.planification;
  const isHoliday = planification.typePlanification?.code === "JOUR_FERIE";

  return {
    titre: isHoliday ? "Rappel jour ferie" : "Rappel planification RH",
    message:
      reminder.message ||
      `${planification.titre} est prevu(e) sur la periode du ${formatPeriod(planification)}.`,
    type: isHoliday ? "JOUR_FERIE" : "PLANIFICATION",
    url: "/dashboard/planification",
    icon: isHoliday ? "calendar-off" : "calendar-clock",
  };
}

async function createUniqueNotification(compteId, payload) {
  const since = new Date(Date.now() - 12 * 60 * 60 * 1000);
  const existing = await prisma.notification.findFirst({
    where: {
      compteId,
      roleId: null,
      titre: payload.titre,
      message: payload.message,
      dateEnvoi: { gte: since },
    },
    select: { id: true },
  });

  if (existing) {
    return existing;
  }

  return prisma.notification.create({
    data: {
      compteId,
      roleId: null,
      titre: payload.titre,
      message: payload.message,
      type: payload.type,
      url: payload.url,
      icon: payload.icon,
      statut: "NON_LU",
      expedider: "SYSTEM",
      dateEnvoi: new Date(),
    },
  });
}

async function main() {
  const now = new Date();
  const dueReminders = await prisma.rappelPlanification.findMany({
    where: {
      envoye: false,
      dateRappel: { lte: now },
      planification: {
        statut: { notIn: ["ANNULE", "TERMINE"] },
      },
    },
    include: {
      planification: {
        include: {
          typePlanification: true,
          participants: {
            select: { agentId: true },
          },
        },
      },
    },
    orderBy: [{ dateRappel: "asc" }, { id: "asc" }],
  });

  let notificationsCreated = 0;

  for (const reminder of dueReminders) {
    const recipients = await resolveReminderRecipients(reminder);
    const payload = buildReminderNotification(reminder);

    for (const compteId of recipients) {
      const before = await prisma.notification.count({
        where: {
          compteId,
          titre: payload.titre,
          message: payload.message,
        },
      });

      await createUniqueNotification(compteId, payload);

      const after = await prisma.notification.count({
        where: {
          compteId,
          titre: payload.titre,
          message: payload.message,
        },
      });

      if (after > before) {
        notificationsCreated += 1;
      }
    }

    await prisma.rappelPlanification.update({
      where: { id: reminder.id },
      data: { envoye: true },
    });
  }

  console.log(
    JSON.stringify(
      {
        status: "ok",
        dueReminders: dueReminders.length,
        notificationsCreated,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("process-planification-reminders failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
