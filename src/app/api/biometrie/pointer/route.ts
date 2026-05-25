import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import { canAccessAgentForPermissions } from "@/server/access/scope";
import { getPresenceDayContextForAgent } from "@/server/horaireAgent";
import { getKinshasaMinutes } from "@/server/presence-pointage";

function parseAgentId(value: unknown) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function getArrivalStatus(input: {
  now: Date;
  scheduleStartMinutes: number;
}) {
  const minutes = getKinshasaMinutes(input.now);
  return minutes > input.scheduleStartMinutes ? "RETARD" : "PRESENCE";
}

export async function POST(req: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non autorise" }, { status: 401 });
  }

  try {
    await requireAccess({ permissions: ["presence.biometric", "presence.sign"] });
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const payload = await req.json().catch(() => null);
  const agentId = parseAgentId(payload?.agentId);
  if (!agentId) {
    return NextResponse.json({ message: "agentId invalide" }, { status: 400 });
  }

  const allowed = await canAccessAgentForPermissions(auth.userId, agentId, [
    "presence.biometric",
    "presence.sign",
  ]);
  if (!allowed) {
    return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
  }

  const dayContext = await getPresenceDayContextForAgent(agentId);
  if (!dayContext) {
    return NextResponse.json(
      { message: "Aucun horaire de travail actif n'est configure pour aujourd'hui." },
      { status: 400 }
    );
  }

  if (dayContext.state === "CONGE") {
    return NextResponse.json(
      { message: "Cet agent est en conge aujourd'hui. Pointage refuse." },
      { status: 400 }
    );
  }

  if (dayContext.state === "HOLIDAY") {
    return NextResponse.json(
      { message: "Jour ferie aujourd'hui. Aucun pointage de presence n'est autorise." },
      { status: 400 }
    );
  }

  if (dayContext.state === "OFF") {
    return NextResponse.json(
      { message: "Cet agent est en jour off aujourd'hui. Pointage refuse." },
      { status: 400 }
    );
  }

  if (dayContext.state !== "WORKING") {
    return NextResponse.json(
      { message: "Aucun horaire de travail actif n'est configure pour aujourd'hui." },
      { status: 400 }
    );
  }

  const schedule = dayContext.schedule;
  if (!schedule.isWithinSchedule) {
    return NextResponse.json(
      {
        message: `Pointage indisponible. Horaire de travail aujourd'hui: ${schedule.startLabel} a ${schedule.endLabel}.`,
      },
      { status: 400 }
    );
  }

  const now = new Date();
  const blockedStatus = await prisma.presence.findFirst({
    where: {
      agentId,
      date: dayContext.todayDate,
      statut: { in: ["CONGE", "OFF", "ABSENT"] },
    },
    orderBy: [{ id: "desc" }],
  });
  if (blockedStatus) {
    return NextResponse.json(
      {
        message: `Pointage refuse. Le statut du jour est ${blockedStatus.statut}.`,
      },
      { status: 400 }
    );
  }

  const latest = await prisma.presence.findFirst({
    where: {
      agentId,
      date: dayContext.todayDate,
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
  });

  let action: "ARRIVEE" | "DEPART" = "ARRIVEE";
  let data;

  if (latest && latest.heureArrivee && !latest.heureDepart) {
    action = "DEPART";
    data = await prisma.presence.update({
      where: { id: latest.id },
      data: {
        heureDepart: now,
        updatedAt: now,
      },
    });
  } else {
    action = "ARRIVEE";
    const statut = getArrivalStatus({
      now,
      scheduleStartMinutes: schedule.startMinutes,
    });
    data = await prisma.presence.create({
      data: {
        agentId,
        date: dayContext.todayDate,
        heureArrivee: now,
        heureDepart: null,
        statut,
        statutWorkflow: "BROUILLON",
      },
    });
  }

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { nom: true, prenom: true, matricule: true },
  });

  return NextResponse.json(
    {
      message:
        action === "ARRIVEE"
          ? "Arrivee pointee automatiquement."
          : "Depart pointe automatiquement.",
      action,
      completed: true,
      data,
      latestPointage: {
        id: `${data.id}-${action}`,
        agentId,
        date: data.date,
        type: action,
        heurePointage: action === "ARRIVEE" ? data.heureArrivee : data.heureDepart,
        fullName: agent ? `${agent.nom} ${agent.prenom}`.trim() : `Agent #${agentId}`,
        matricule: agent?.matricule ?? "-",
      },
    },
    { status: 200 }
  );
}
