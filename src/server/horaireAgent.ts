import prisma from "@/lib/prisma";

const KINSHASA_TIMEZONE = "Africa/Kinshasa";
const DAY_LABELS = {
  lundi: "Lun",
  mardi: "Mar",
  mercredi: "Mer",
  jeudi: "Jeu",
  vendredi: "Ven",
  samedi: "Sam",
  dimanche: "Dim",
} as const;
const DAY_FIELDS = Object.keys(DAY_LABELS) as Array<keyof typeof DAY_LABELS>;

function getKinshasaNow() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: KINSHASA_TIMEZONE })
  );
}

function getKinshasaDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getKinshasaStartOfDay(date: Date) {
  return new Date(`${getKinshasaDateKey(date)}T00:00:00`);
}

function getDayField(date: Date) {
  const fields = [
    "dimanche",
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
  ] as const;

  return fields[date.getDay()];
}

function getTimeMinutes(value: Date) {
  return value.getUTCHours() * 60 + value.getUTCMinutes();
}

function formatDateLabel(value?: Date | null) {
  if (!value) {
    return "sans fin";
  }

  return value.toLocaleDateString("fr-FR");
}

function formatScheduleTime(value: Date) {
  return `${`${value.getUTCHours()}`.padStart(2, "0")}:${`${value.getUTCMinutes()}`.padStart(2, "0")}`;
}

function getEnabledDays(horaireAgent: {
  lundi: boolean;
  mardi: boolean;
  mercredi: boolean;
  jeudi: boolean;
  vendredi: boolean;
  samedi: boolean;
  dimanche: boolean;
}) {
  return DAY_FIELDS.filter((day) => Boolean(horaireAgent[day]))
    .map((day) => DAY_LABELS[day])
    .join(", ");
}

function enrichHoraireAssignment(
  now: Date,
  horaireAgent: ({
    creerPar?: { login?: string | null } | null;
    horaire: {
      nomHoraire: string;
      heureDebut: Date;
      heureFin: Date;
    };
  } & {
    id: number;
    agentId: number;
    horaireId: number;
    dateDebut: Date;
    dateFin: Date | null;
    creerParId: number;
    lundi: boolean;
    mardi: boolean;
    mercredi: boolean;
    jeudi: boolean;
    vendredi: boolean;
    samedi: boolean;
    dimanche: boolean;
    createdAt: Date;
  })
) {
  const startMinutes = getTimeMinutes(horaireAgent.horaire.heureDebut);
  const endMinutes = getTimeMinutes(horaireAgent.horaire.heureFin);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return {
    ...horaireAgent,
    startMinutes,
    endMinutes,
    currentMinutes,
    startLabel: formatScheduleTime(horaireAgent.horaire.heureDebut),
    endLabel: formatScheduleTime(horaireAgent.horaire.heureFin),
    daysLabel: getEnabledDays(horaireAgent),
    rangeLabel: `du ${formatDateLabel(horaireAgent.dateDebut)} au ${formatDateLabel(horaireAgent.dateFin)}`,
    creatorLabel: horaireAgent.creerPar?.login || "le chef de service",
    isWithinSchedule:
      currentMinutes >= startMinutes && currentMinutes <= endMinutes,
    isAfterSchedule: currentMinutes > endMinutes,
  };
}

export async function getAgentIdFromUtilisateurId(utilisateurId: number) {
  const compteAgent = await prisma.compteAgent.findUnique({
    where: { utilisateurId },
    select: { agentId: true },
  });

  return compteAgent?.agentId ?? null;
}

async function getTodayHoraireForAgent(agentId: number) {
  const now = getKinshasaNow();
  const todayStart = getKinshasaStartOfDay(now);
  const dayField = getDayField(now);

  const horaireAgent = await prisma.horaireAgent.findFirst({
    where: {
      agentId,
      dateDebut: { lte: todayStart },
      OR: [{ dateFin: null }, { dateFin: { gte: todayStart } }],
      [dayField]: true,
    },
    include: {
      horaire: true,
      creerPar: {
        select: { login: true },
      },
    },
    orderBy: [{ dateDebut: "desc" }, { createdAt: "desc" }],
  });

  if (!horaireAgent) {
    return null;
  }

  const enriched = enrichHoraireAssignment(now, horaireAgent);

  return {
    now,
    ...enriched,
    horaireAgent: enriched,
    horaire: enriched.horaire,
    todayDate: todayStart,
  };
}

async function getHoraireContextForAgent(agentId: number) {
  const now = getKinshasaNow();
  const todayStart = getKinshasaStartOfDay(now);
  const dayField = getDayField(now);

  const [activeSchedule, currentRangeSchedule, nextSchedule] = await Promise.all([
    prisma.horaireAgent.findFirst({
      where: {
        agentId,
        dateDebut: { lte: todayStart },
        OR: [{ dateFin: null }, { dateFin: { gte: todayStart } }],
        [dayField]: true,
      },
      include: {
        horaire: true,
        creerPar: { select: { login: true } },
      },
      orderBy: [{ dateDebut: "desc" }, { createdAt: "desc" }],
    }),
    prisma.horaireAgent.findFirst({
      where: {
        agentId,
        dateDebut: { lte: todayStart },
        OR: [{ dateFin: null }, { dateFin: { gte: todayStart } }],
      },
      include: {
        horaire: true,
        creerPar: { select: { login: true } },
      },
      orderBy: [{ dateDebut: "desc" }, { createdAt: "desc" }],
    }),
    prisma.horaireAgent.findFirst({
      where: {
        agentId,
        dateDebut: { gt: todayStart },
      },
      include: {
        horaire: true,
        creerPar: { select: { login: true } },
      },
      orderBy: [{ dateDebut: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  return {
    agentId,
    now,
    todayDate: todayStart,
    activeSchedule: activeSchedule ? enrichHoraireAssignment(now, activeSchedule) : null,
    currentRangeSchedule: currentRangeSchedule
      ? enrichHoraireAssignment(now, currentRangeSchedule)
      : null,
    nextSchedule: nextSchedule ? enrichHoraireAssignment(now, nextSchedule) : null,
  };
}

export async function getTodayHoraireForUtilisateur(utilisateurId: number) {
  const agentId = await getAgentIdFromUtilisateurId(utilisateurId);
  if (!agentId) {
    return null;
  }

  return getTodayHoraireForAgent(agentId);
}

export async function getHoraireContextForUtilisateur(utilisateurId: number) {
  const agentId = await getAgentIdFromUtilisateurId(utilisateurId);
  if (!agentId) {
    return null;
  }

  return getHoraireContextForAgent(agentId);
}

export async function getActiveCongeForAgent(agentId: number, date: Date) {
  return prisma.demandeConge.findFirst({
    where: {
      agentId,
      statut: { in: ["CONFIRME", "VALIDE"] },
      dateDebut: { lte: date },
      dateFin: { gte: date },
    },
    include: {
      typeConge: {
        select: { libelle: true, code: true },
      },
    },
    orderBy: [{ dateDebut: "desc" }, { id: "desc" }],
  });
}

export async function getPresenceDayContextForUtilisateur(utilisateurId: number) {
  const agentId = await getAgentIdFromUtilisateurId(utilisateurId);
  if (!agentId) {
    return null;
  }

  const horaireContext = await getHoraireContextForAgent(agentId);
  if (!horaireContext) {
    return null;
  }

  const conge = await getActiveCongeForAgent(agentId, horaireContext.todayDate);

  if (conge) {
    return {
      ...horaireContext,
      agentId,
      state: "CONGE" as const,
      conge,
      schedule: null,
    };
  }

  if (horaireContext.activeSchedule) {
    return {
      ...horaireContext,
      agentId,
      state: "WORKING" as const,
      schedule: horaireContext.activeSchedule,
      conge: null,
    };
  }

  if (horaireContext.currentRangeSchedule) {
    return {
      ...horaireContext,
      agentId,
      state: "OFF" as const,
      schedule: horaireContext.currentRangeSchedule,
      conge: null,
    };
  }

  return {
    ...horaireContext,
    agentId,
    state: "NO_SCHEDULE" as const,
    schedule: horaireContext.nextSchedule,
    conge: null,
  };
}
