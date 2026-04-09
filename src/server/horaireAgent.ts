import prisma from "@/lib/prisma";
import { CiblePlanification } from "@/generated/prisma";

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

function getKinshasaDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: KINSHASA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
    hour: getPart("hour"),
    minute: getPart("minute"),
  };
}

function getKinshasaNow() {
  const parts = getKinshasaDateParts();
  return new Date(
    Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      0
    )
  );
}

function getKinshasaDateKey(date = new Date()) {
  const parts = getKinshasaDateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function getKinshasaStartOfDay(date = new Date()) {
  return new Date(`${getKinshasaDateKey(date)}T00:00:00.000Z`);
}

function getKinshasaCurrentMinutes(date = new Date()) {
  const parts = getKinshasaDateParts(date);
  return Number(parts.hour) * 60 + Number(parts.minute);
}

function getDayField(date = new Date()) {
  const weekday = new Intl.DateTimeFormat("fr-FR", {
    timeZone: KINSHASA_TIMEZONE,
    weekday: "long",
  })
    .format(date)
    .toLowerCase();

  const normalized = weekday.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const dayField = DAY_FIELDS.find((field) => field === normalized);

  return dayField ?? "lundi";
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
  const currentMinutes = getKinshasaCurrentMinutes();

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
  const todayStart = getKinshasaStartOfDay();
  const dayField = getDayField();

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
  const todayStart = getKinshasaStartOfDay();
  const dayField = getDayField();

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

async function getPrincipalOrganisationScopeForAgent(agentId: number) {
  const affectation = await prisma.affectation.findFirst({
    where: {
      agentId,
      actif: true,
      principale: true,
      statutOrganisationnel: "ACTIVE",
    },
    select: {
      typeOrgaUniteProvince: {
        select: {
          provinceId: true,
          uniteOrganisationnelleId: true,
        },
      },
    },
    orderBy: [{ dateDebut: "desc" }, { id: "desc" }],
  });

  return {
    provinceId: affectation?.typeOrgaUniteProvince?.provinceId ?? null,
    uniteOrganisationnelleId:
      affectation?.typeOrgaUniteProvince?.uniteOrganisationnelleId ?? null,
  };
}

async function getActiveHolidayForAgent(agentId: number, date: Date) {
  const scope = await getPrincipalOrganisationScopeForAgent(agentId);
  const targetFilters = [
    { cible: CiblePlanification.TOUTE_ORGANISATION },
    ...(scope.provinceId
      ? [{ cible: CiblePlanification.PROVINCE, provinceId: scope.provinceId }]
      : []),
    ...(scope.uniteOrganisationnelleId
      ? [
          {
            cible: CiblePlanification.UNITE,
            uniteOrganisationnelleId: scope.uniteOrganisationnelleId,
          },
        ]
      : []),
  ];

  return prisma.planification.findFirst({
    where: {
      typePlanification: { code: "JOUR_FERIE" },
      statut: { in: ["PLANIFIE", "EN_COURS"] },
      dateDebut: { lte: date },
      AND: [
        { OR: [{ dateFin: null }, { dateFin: { gte: date } }] },
        { OR: targetFilters },
      ],
    },
    include: {
      typePlanification: {
        select: { id: true, code: true, nom: true },
      },
      province: {
        select: { id: true, code: true, nom: true },
      },
      uniteOrganisationnelle: {
        select: { id: true, code: true, nom: true },
      },
    },
    orderBy: [{ cible: "desc" }, { dateDebut: "desc" }, { id: "desc" }],
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
  const holiday = await getActiveHolidayForAgent(agentId, horaireContext.todayDate);

  if (conge) {
    return {
      ...horaireContext,
      agentId,
      state: "CONGE" as const,
      conge,
      schedule: null,
    };
  }

  if (holiday) {
    return {
      ...horaireContext,
      agentId,
      state: "HOLIDAY" as const,
      holiday,
      conge: null,
      schedule: horaireContext.activeSchedule ?? horaireContext.currentRangeSchedule ?? null,
    };
  }

  if (horaireContext.activeSchedule) {
    return {
      ...horaireContext,
      agentId,
      state: "WORKING" as const,
      schedule: horaireContext.activeSchedule,
      conge: null,
      holiday: null,
    };
  }

  if (horaireContext.currentRangeSchedule) {
    return {
      ...horaireContext,
      agentId,
      state: "OFF" as const,
      schedule: horaireContext.currentRangeSchedule,
      conge: null,
      holiday: null,
    };
  }

  return {
    ...horaireContext,
    agentId,
    state: "NO_SCHEDULE" as const,
    schedule: horaireContext.nextSchedule,
    conge: null,
    holiday: null,
  };
}
