import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import { canAccessAgentForPermissions } from "@/server/access/scope";
import { getPresenceDayContextForAgent } from "@/server/horaireAgent";

function parseAgentId(value: unknown) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parseConfirmDeparture(value: unknown) {
  return value === true || value === "true" || value === 1 || value === "1";
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
  const confirmDeparture = parseConfirmDeparture(payload?.confirmDeparture);

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
  const existingPresence = await prisma.presence.findUnique({
    where: {
      agentId_date: {
        agentId,
        date: dayContext.todayDate,
      },
    },
  });

  if (existingPresence) {
    if (["CONGE", "OFF", "ABSENT"].includes(existingPresence.statut)) {
      return NextResponse.json(
        { message: `Pointage refuse. Le statut du jour est ${existingPresence.statut}.` },
        { status: 400 }
      );
    }

    if (existingPresence.heureArrivee && !existingPresence.heureDepart) {
      if (!confirmDeparture) {
        return NextResponse.json(
          {
            message: "Confirmation requise pour pointer le depart.",
            requiresDepartureConfirmation: true,
            action: "DEPART",
            alreadySigned: false,
            completed: false,
            data: {
              id: existingPresence.id,
              date: existingPresence.date,
              heureArrivee: existingPresence.heureArrivee,
              heureDepart: existingPresence.heureDepart,
              statut: existingPresence.statut,
            },
          },
          { status: 200 }
        );
      }

      const now = new Date();
      const data = await prisma.presence.update({
        where: { id: existingPresence.id },
        data: {
          heureDepart: now,
          updatedAt: now,
        },
      });

      return NextResponse.json(
        {
          message: "Depart pointe avec succes.",
          requiresDepartureConfirmation: false,
          action: "DEPART",
          alreadySigned: false,
          completed: true,
          data,
        },
        { status: 200 }
      );
    }

    if (existingPresence.heureArrivee && existingPresence.heureDepart) {
      return NextResponse.json(
        {
          message: "Arrivee et depart deja pointes aujourd'hui.",
          requiresDepartureConfirmation: false,
          action: "AUCUNE",
          alreadySigned: true,
          completed: true,
          data: existingPresence,
        },
        { status: 200 }
      );
    }
  }

  if (!schedule.isWithinSchedule) {
    return NextResponse.json(
      {
        message: `Pointage indisponible. Horaire de travail aujourd'hui: ${schedule.startLabel} a ${schedule.endLabel}.`,
      },
      { status: 400 }
    );
  }

  const now = new Date();
  const statut = schedule.currentMinutes > schedule.startMinutes ? "RETARD" : "PRESENCE";

  const data = existingPresence
    ? await prisma.presence.update({
        where: { id: existingPresence.id },
        data: {
          heureArrivee: now,
          statut,
          statutWorkflow: "BROUILLON",
          updatedAt: now,
        },
      })
    : await prisma.presence.create({
        data: {
          agentId,
          date: dayContext.todayDate,
          heureArrivee: now,
          statut,
          statutWorkflow: "BROUILLON",
        },
      });

  return NextResponse.json(
    {
      message: "Arrivee pointee avec succes.",
      requiresDepartureConfirmation: false,
      action: "ARRIVEE",
      alreadySigned: false,
      completed: false,
      data,
    },
    { status: 200 }
  );
}
