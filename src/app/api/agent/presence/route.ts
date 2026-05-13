import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import { canAccessAgentForPermissions } from "@/server/access/scope";
import {
  getAgentIdFromUtilisateurId,
  getPresenceDayContextForUtilisateur,
} from "@/server/horaireAgent";
import { getKinshasaMinutes } from "@/server/presence-pointage";

const BLOCKED_STATUSES = ["CONGE", "OFF", "ABSENT"] as const;

function parseOptionalDate(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function parseOptionalId(value: unknown) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function getArrivalStatus(input: { now: Date; scheduleStartMinutes: number }) {
  const minutes = getKinshasaMinutes(input.now);
  return minutes > input.scheduleStartMinutes ? "RETARD" : "PRESENCE";
}

export const POST = async (req: Request) => {
  const utilisateur = await getAuthenticatedUser();
  if (!utilisateur) {
    return NextResponse.json({ status: 401, message: "Non autorise" }, { status: 401 });
  }

  try {
    await requireAccess({
      permissions: ["presence.sign"],
    });
  } catch {
    return NextResponse.json({ status: 403, message: "Acces interdit" }, { status: 403 });
  }

  const payload = await req.json().catch(() => null);
  const providedDate = parseOptionalDate(payload?.todayDate);
  if (payload?.todayDate !== undefined && !providedDate) {
    return NextResponse.json(
      { status: 400, message: "Date de pointage invalide" },
      { status: 400 }
    );
  }

  const now = providedDate ?? new Date();
  const dayContext = await getPresenceDayContextForUtilisateur(utilisateur.userId);
  if (!dayContext) {
    return NextResponse.json(
      { status: 400, message: "Aucun horaire de travail actif n'est configure pour aujourd'hui." },
      { status: 400 }
    );
  }

  if (dayContext.state === "CONGE") {
    return NextResponse.json(
      { status: 400, message: "Vous etes en conge aujourd'hui. Aucun pointage de presence n'est autorise." },
      { status: 400 }
    );
  }

  if (dayContext.state === "HOLIDAY") {
    return NextResponse.json(
      {
        status: 400,
        message: `Jour ferie aujourd'hui: ${dayContext.holiday?.titre ?? "Jour ferie"}. Aucun pointage de presence n'est autorise.`,
      },
      { status: 400 }
    );
  }

  if (dayContext.state === "OFF") {
    return NextResponse.json(
      { status: 400, message: "Vous etes en jour off aujourd'hui. Aucun pointage de presence n'est autorise." },
      { status: 400 }
    );
  }

  if (dayContext.state !== "WORKING") {
    return NextResponse.json(
      { status: 400, message: "Aucun horaire de travail actif n'est configure pour aujourd'hui." },
      { status: 400 }
    );
  }

  const schedule = dayContext.schedule;

  if (!schedule.isWithinSchedule) {
    return NextResponse.json(
      {
        status: 400,
        message: `Pointage indisponible. Votre horaire de travail aujourd'hui est de ${schedule.startLabel} a ${schedule.endLabel}.`,
      },
      { status: 400 }
    );
  }

  const blockedStatus = await prisma.presence.findFirst({
    where: {
      agentId: schedule.agentId,
      date: dayContext.todayDate,
      statut: { in: [...BLOCKED_STATUSES] },
    },
    orderBy: [{ id: "desc" }],
  });

  if (blockedStatus) {
    return NextResponse.json(
      { status: 400, message: `Pointage refuse. Le statut du jour est ${blockedStatus.statut}.` },
      { status: 400 }
    );
  }

  const latestPresence = await prisma.presence.findFirst({
    where: {
      agentId: schedule.agentId,
      date: dayContext.todayDate,
    },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
  });

  let action: "ARRIVEE" | "DEPART" = "ARRIVEE";
  let result;

  if (latestPresence && latestPresence.heureArrivee && !latestPresence.heureDepart) {
    action = "DEPART";
    result = await prisma.presence.update({
      where: { id: latestPresence.id },
      data: {
        heureDepart: now,
        updatedAt: now,
      },
    });
  } else {
    action = "ARRIVEE";
    result = await prisma.presence.create({
      data: {
        agentId: schedule.agentId,
        date: dayContext.todayDate,
        heureArrivee: now,
        heureDepart: null,
        statut: getArrivalStatus({
          now,
          scheduleStartMinutes: schedule.startMinutes,
        }),
        statutWorkflow: "BROUILLON",
      },
    });
  }

  return NextResponse.json(
    {
      status: 200,
      action,
      completed: true,
      message: action === "ARRIVEE" ? "Arrivee pointee." : "Depart pointe.",
      result,
      latestPointage: {
        id: `${result.id}-${action}`,
        date: result.date,
        type: action,
        heurePointage: action === "ARRIVEE" ? result.heureArrivee : result.heureDepart,
      },
    },
    { status: 200 }
  );
};

export const PUT = async (req: Request) => {
  const payload = await req.json().catch(() => null);
  const operation = String(payload?.action ?? "").trim().toLowerCase();

  const utilisateur = await getAuthenticatedUser();
  if (!utilisateur) {
    return NextResponse.json({ status: 401, message: "Non autorise" }, { status: 401 });
  }

  try {
    let result;
    const now = new Date();

    if (operation === "check_out") {
      try {
        await requireAccess({
          permissions: ["presence.update", "presence.sign"],
        });
      } catch {
        return NextResponse.json({ status: 403, message: "Acces interdit" }, { status: 403 });
      }

      const parsedCheckoutDate = parseOptionalDate(payload?.todayDate);
      if (payload?.todayDate !== undefined && !parsedCheckoutDate) {
        return NextResponse.json({ status: 400, message: "Date invalide" }, { status: 400 });
      }
      const checkoutDate = parsedCheckoutDate ?? now;

      const dayContext = await getPresenceDayContextForUtilisateur(utilisateur.userId);
      if (!dayContext || dayContext.state !== "WORKING") {
        return NextResponse.json(
          { status: 400, message: "Aucun horaire de travail actif n'est configure pour aujourd'hui." },
          { status: 400 }
        );
      }

      if (!dayContext.schedule.isWithinSchedule) {
        return NextResponse.json(
          {
            status: 400,
            message: `Pointage indisponible. Votre horaire de travail aujourd'hui est de ${dayContext.schedule.startLabel} a ${dayContext.schedule.endLabel}.`,
          },
          { status: 400 }
        );
      }

      const requestedPresenceId = parseOptionalId(payload?.id);
      if (payload?.id !== undefined && !requestedPresenceId) {
        return NextResponse.json({ status: 400, message: "ID invalide" }, { status: 400 });
      }
      const targetPresence = requestedPresenceId
        ? await prisma.presence.findUnique({ where: { id: requestedPresenceId } })
        : await prisma.presence.findFirst({
            where: {
              agentId: dayContext.agentId,
              date: dayContext.todayDate,
              heureArrivee: { not: null },
              heureDepart: null,
            },
            orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
          });

      if (!targetPresence) {
        return NextResponse.json(
          { status: 404, message: "Aucune presence ouverte pour enregistrer le depart." },
          { status: 404 }
        );
      }

      if (
        !(await canAccessAgentForPermissions(utilisateur.userId, targetPresence.agentId, [
          "presence.update",
          "presence.sign",
        ]))
      ) {
        return NextResponse.json({ status: 403, message: "Acces interdit" }, { status: 403 });
      }

      if (BLOCKED_STATUSES.includes(String(targetPresence.statut) as (typeof BLOCKED_STATUSES)[number])) {
        return NextResponse.json(
          { status: 400, message: `Le statut ${targetPresence.statut} ne peut pas etre transforme en depart.` },
          { status: 400 }
        );
      }

      if (!targetPresence.heureArrivee) {
        return NextResponse.json(
          { status: 400, message: "Impossible de pointer un depart sans heure d'arrivee." },
          { status: 400 }
        );
      }

      if (targetPresence.heureDepart) {
        return NextResponse.json(
          { status: 400, message: "Le depart est deja enregistre pour cette ligne." },
          { status: 400 }
        );
      }

      result = await prisma.presence.update({
        where: { id: targetPresence.id },
        data: {
          heureDepart: checkoutDate,
          updatedAt: now,
        },
      });
    } else if (operation === "confirm") {
      try {
        await requireAccess({
          permissions: ["presence.confirm"],
        });
      } catch {
        return NextResponse.json({ status: 403, message: "Acces interdit" }, { status: 403 });
      }

      const id = parseOptionalId(payload?.id);
      if (!id) {
        return NextResponse.json({ status: 400, message: "ID invalide" }, { status: 400 });
      }

      const presence = await prisma.presence.findUnique({
        where: { id },
        select: { agentId: true },
      });

      if (!presence) {
        return NextResponse.json({ status: 404, message: "Presence introuvable" }, { status: 404 });
      }

      if (!(await canAccessAgentForPermissions(utilisateur.userId, presence.agentId, ["presence.confirm"]))) {
        return NextResponse.json({ status: 403, message: "Acces interdit" }, { status: 403 });
      }

      result = await prisma.presence.update({
        where: { id },
        data: {
          confirmePar: { connect: { id: utilisateur.userId } },
          updatedAt: now,
          statutWorkflow: "CONFIRME",
        },
      });
    } else if (operation === "validate") {
      try {
        await requireAccess({
          permissions: ["presence.validate"],
        });
      } catch {
        return NextResponse.json({ status: 403, message: "Acces interdit" }, { status: 403 });
      }

      const id = parseOptionalId(payload?.id);
      if (!id) {
        return NextResponse.json({ status: 400, message: "ID invalide" }, { status: 400 });
      }

      const presence = await prisma.presence.findUnique({
        where: { id },
        select: { agentId: true },
      });

      if (!presence) {
        return NextResponse.json({ status: 404, message: "Presence introuvable" }, { status: 404 });
      }

      if (!(await canAccessAgentForPermissions(utilisateur.userId, presence.agentId, ["presence.validate"]))) {
        return NextResponse.json({ status: 403, message: "Acces interdit" }, { status: 403 });
      }

      result = await prisma.presence.update({
        where: { id },
        data: {
          validePar: { connect: { id: utilisateur.userId } },
          updatedAt: now,
          statutWorkflow: "VALIDE",
        },
      });
    } else {
      return NextResponse.json({ status: 400, message: "Action de presence invalide" }, { status: 400 });
    }

    return NextResponse.json({ status: 200, result }, { status: 200 });
  } catch {
    return NextResponse.json({ status: 500, message: "Erreur serveur" }, { status: 500 });
  }
};

export const GET = async () => {
  const utilisateur = await getAuthenticatedUser();
  if (!utilisateur) {
    return NextResponse.json({ status: 401, message: "Non autorise" }, { status: 401 });
  }

  try {
    await requireAccess({
      permissions: ["presence.read"],
    });
  } catch {
    return NextResponse.json({ status: 403, message: "Acces interdit" }, { status: 403 });
  }

  const agentId = await getAgentIdFromUtilisateurId(utilisateur.userId);
  if (!agentId) {
    return NextResponse.json({ status: 200, rest: "GET", getData: [] }, { status: 200 });
  }

  const getData = await prisma.presence.findMany({
    where: { agentId },
    include: { agent: true },
    orderBy: [{ date: "desc" }, { updatedAt: "desc" }, { id: "desc" }],
  });

  return NextResponse.json({ status: 200, rest: "GET", getData }, { status: 200 });
};

export const DELETE = async (req: Request) => {
  const payload = await req.json().catch(() => null);
  const id = parseOptionalId(payload?.id);

  const utilisateur = await getAuthenticatedUser();
  if (!utilisateur) {
    return NextResponse.json({ status: 401, message: "Non autorise" }, { status: 401 });
  }

  try {
    await requireAccess({
      permissions: ["presence.delete"],
    });
  } catch {
    return NextResponse.json({ status: 403, message: "Acces interdit" }, { status: 403 });
  }

  if (!id) {
    return NextResponse.json({ status: 400, message: "ID invalide" }, { status: 400 });
  }

  const agentId = await getAgentIdFromUtilisateurId(utilisateur.userId);
  if (!agentId) {
    return NextResponse.json({ status: 400, message: "Agent introuvable" }, { status: 400 });
  }

  const targetPresence = await prisma.presence.findUnique({
    where: { id },
    select: { id: true, agentId: true },
  });

  if (!targetPresence) {
    return NextResponse.json({ status: 404, message: "Presence introuvable" }, { status: 404 });
  }

  if (targetPresence.agentId !== agentId) {
    return NextResponse.json({ status: 403, message: "Acces interdit" }, { status: 403 });
  }

  const result = await prisma.presence.delete({
    where: {
      id,
    },
  });

  return NextResponse.json({ status: 200, result }, { status: 200 });
};
