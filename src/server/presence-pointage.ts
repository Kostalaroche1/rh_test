import prisma from "@/lib/prisma";

const KINSHASA_TIMEZONE = "Africa/Kinshasa";
const DAY_FIELDS = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
] as const;

type DayField = (typeof DAY_FIELDS)[number];

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

export function getKinshasaDateKey(date = new Date()) {
  const parts = getKinshasaDateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getKinshasaStartOfDay(date = new Date()) {
  return new Date(`${getKinshasaDateKey(date)}T00:00:00.000Z`);
}

export function getKinshasaMinutes(date = new Date()) {
  const parts = getKinshasaDateParts(date);
  return Number(parts.hour) * 60 + Number(parts.minute);
}

export function getDayFieldForKinshasa(date = new Date()): DayField {
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

function getScheduleMinutes(value: Date) {
  return value.getUTCHours() * 60 + value.getUTCMinutes();
}

export async function getHoraireAssignmentForAgentOnDate(agentId: number, date: Date) {
  const dayStart = getKinshasaStartOfDay(date);
  const dayField = getDayFieldForKinshasa(date);

  const assignment = await prisma.horaireAgent.findFirst({
    where: {
      agentId,
      dateDebut: { lte: dayStart },
      OR: [{ dateFin: null }, { dateFin: { gte: dayStart } }],
      [dayField]: true,
    },
    include: {
      horaire: true,
    },
    orderBy: [{ dateDebut: "desc" }, { createdAt: "desc" }],
  });

  if (!assignment) {
    return null;
  }

  const startMinutes = getScheduleMinutes(assignment.horaire.heureDebut);
  const endMinutes = getScheduleMinutes(assignment.horaire.heureFin);

  return {
    assignment,
    dayStart,
    dayField,
    startMinutes,
    endMinutes,
  };
}

export function isPointageWithinSchedule(input: {
  time: Date;
  startMinutes: number;
  endMinutes: number;
}) {
  const currentMinutes = getKinshasaMinutes(input.time);
  return currentMinutes >= input.startMinutes && currentMinutes <= input.endMinutes;
}
