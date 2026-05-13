import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import {
  canAccessAgentForPermissions,
  getAccessibleAgentIdsForPermissions,
} from "@/server/access/scope";
import {
  getHoraireAssignmentForAgentOnDate,
  getKinshasaDateKey,
  isPointageWithinSchedule,
} from "@/server/presence-pointage";

type PointageType = "ARRIVEE" | "DEPART";

function parsePresenceId(value: unknown) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function parsePointageType(value: unknown): PointageType | null {
  if (value === "ARRIVEE" || value === "DEPART") {
    return value;
  }
  return null;
}

function parsePointageDateTime(value: unknown) {
  const parsed = new Date(String(value ?? ""));
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function parseNote(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim();
  return normalized.length ? normalized : null;
}

function mapPresenceToPointages(presence: {
  id: number;
  date: Date;
  heureArrivee: Date | null;
  heureDepart: Date | null;
  agent: {
    id: number;
    nom: string;
    prenom: string;
    matricule: string;
  };
}) {
  const entries: Array<{
    presenceId: number;
    id: string;
    date: Date;
    type: PointageType;
    heurePointage: string;
    source: string;
    note: string | null;
    createdById: number | null;
    updatedById: number | null;
    agent: {
      id: number;
      nom: string;
      prenom: string;
      matricule: string;
    };
  }> = [];

  if (presence.heureArrivee) {
    entries.push({
      presenceId: presence.id,
      id: `${presence.id}-ARRIVEE`,
      date: presence.date,
      type: "ARRIVEE",
      heurePointage: presence.heureArrivee.toISOString(),
      source: "BIOMETRIE",
      note: null,
      createdById: null,
      updatedById: null,
      agent: presence.agent,
    });
  }

  if (presence.heureDepart) {
    entries.push({
      presenceId: presence.id,
      id: `${presence.id}-DEPART`,
      date: presence.date,
      type: "DEPART",
      heurePointage: presence.heureDepart.toISOString(),
      source: "BIOMETRIE",
      note: null,
      createdById: null,
      updatedById: null,
      agent: presence.agent,
    });
  }

  return entries;
}

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non autorise" }, { status: 401 });
  }

  try {
    await requireAccess({
      permissions: ["presence.read", "presence.update"],
    });
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const accessibleAgentIds = await getAccessibleAgentIdsForPermissions(auth.userId, [
    "presence.read",
    "presence.update",
    "presence.confirm",
    "presence.validate",
  ]);

  const presences = await prisma.presence.findMany({
    where:
      accessibleAgentIds === null
        ? undefined
        : {
            agentId: {
              in: accessibleAgentIds.length ? accessibleAgentIds : [-1],
            },
          },
    include: {
      agent: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          matricule: true,
        },
      },
    },
    orderBy: [{ date: "desc" }, { updatedAt: "desc" }, { id: "desc" }],
    take: 500,
  });

  const getData = presences
    .flatMap((presence) => mapPresenceToPointages(presence))
    .sort((a, b) => {
      const aTime = new Date(a.heurePointage).getTime();
      const bTime = new Date(b.heurePointage).getTime();
      if (aTime !== bTime) return bTime - aTime;
      return b.id.localeCompare(a.id);
    })
    .slice(0, 500);

  return NextResponse.json(
    {
      status: 200,
      rest: "GET",
      getData,
      latest: getData[0] ?? null,
    },
    { status: 200 }
  );
}

export async function PUT(req: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non autorise" }, { status: 401 });
  }

  try {
    await requireAccess({
      permissions: ["presence.update"],
    });
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const payload = await req.json().catch(() => null);
  const presenceId = parsePresenceId(payload?.presenceId);
  const editedType = parsePointageType(payload?.type);
  const newHeurePointage = parsePointageDateTime(payload?.heurePointage);
  const note = parseNote(payload?.note);

  if (!presenceId) {
    return NextResponse.json({ message: "Presence invalide." }, { status: 400 });
  }
  if (!editedType) {
    return NextResponse.json({ message: "Type de pointage invalide." }, { status: 400 });
  }
  if (!newHeurePointage) {
    return NextResponse.json({ message: "Heure de pointage invalide." }, { status: 400 });
  }

  const presence = await prisma.presence.findUnique({
    where: { id: presenceId },
  });

  if (!presence) {
    return NextResponse.json({ message: "Presence introuvable." }, { status: 404 });
  }

  const canAccess = await canAccessAgentForPermissions(auth.userId, presence.agentId, [
    "presence.update",
  ]);
  if (!canAccess) {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const targetDayKey = getKinshasaDateKey(presence.date);
  const newDayKey = getKinshasaDateKey(newHeurePointage);
  if (targetDayKey !== newDayKey) {
    return NextResponse.json(
      {
        message:
          "La correction doit rester sur la meme date de presence (jour Kinshasa).",
      },
      { status: 400 }
    );
  }

  const scheduleContext = await getHoraireAssignmentForAgentOnDate(
    presence.agentId,
    presence.date
  );
  if (!scheduleContext) {
    return NextResponse.json(
      {
        message: "Aucun horaire de travail actif n'est configure pour cette date.",
      },
      { status: 400 }
    );
  }

  if (
    !isPointageWithinSchedule({
      time: newHeurePointage,
      startMinutes: scheduleContext.startMinutes,
      endMinutes: scheduleContext.endMinutes,
    })
  ) {
    return NextResponse.json(
      {
        message: "L'heure corrigee est hors de la plage de travail configuree.",
      },
      { status: 400 }
    );
  }

  const now = new Date();
  const nextData =
    editedType === "ARRIVEE"
      ? {
          heureArrivee: newHeurePointage,
          updatedAt: now,
        }
      : {
          heureDepart: newHeurePointage,
          updatedAt: now,
        };

  const result = await prisma.presence.update({
    where: { id: presence.id },
    data: nextData,
  });

  return NextResponse.json(
    {
      status: 200,
      message: note
        ? `Pointage corrige avec succes. Motif: ${note}`
        : "Pointage corrige avec succes.",
      result,
    },
    { status: 200 }
  );
}
