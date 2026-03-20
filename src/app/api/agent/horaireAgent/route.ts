import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";

function toDateOnly(value: string) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return null;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non authentifie" }, { status: 401 });
  }

  try {
    await requireAccess({
      permissions: ["horaire_agent.read"],
    });
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const [horaireAgents, agents, horaires] = await Promise.all([
    prisma.horaireAgent.findMany({
      include: {
        agent: {
          select: { id: true, nom: true, prenom: true, matricule: true },
        },
        horaire: {
          select: { id: true, nomHoraire: true, heureDebut: true, heureFin: true },
        },
        creerPar: {
          select: { id: true, login: true },
        },
      },
      orderBy: { id: "desc" },
    }),
    prisma.agent.findMany({
      select: { id: true, nom: true, prenom: true, matricule: true },
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
    }),
    prisma.horaireTravail.findMany({
      select: { id: true, nomHoraire: true, heureDebut: true, heureFin: true },
      orderBy: { nomHoraire: "asc" },
    }),
  ]);

  return NextResponse.json(
    { data: horaireAgents, lookups: { agents, horaires } },
    { status: 200 }
  );
}

export async function POST(req: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non authentifie" }, { status: 401 });
  }

  try {
    await requireAccess({
      permissions: ["horaire_agent.assign"],
    });
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const payload = await req.json();
  const agentId = Number(payload.agentId);
  const horaireId = Number(payload.horaireId);
  const dateDebut = toDateOnly(payload.dateDebut);
  const dateFin = payload.dateFin ? toDateOnly(payload.dateFin) : null;
  const todayStart = getTodayStart();

  if (!agentId || !horaireId || !dateDebut) {
    return NextResponse.json(
      { message: "agentId, horaireId et dateDebut sont requis" },
      { status: 400 }
    );
  }

  if (dateDebut < todayStart) {
    return NextResponse.json(
      { message: "dateDebut doit etre aujourd'hui ou dans le futur" },
      { status: 400 }
    );
  }

  if (dateFin && dateFin < todayStart) {
    return NextResponse.json(
      { message: "dateFin doit etre aujourd'hui ou dans le futur" },
      { status: 400 }
    );
  }

  if (dateFin && dateFin < dateDebut) {
    return NextResponse.json(
      { message: "dateFin doit etre superieure ou egale a dateDebut" },
      { status: 400 }
    );
  }

  const created = await prisma.horaireAgent.create({
    data: {
      agentId,
      horaireId,
      dateDebut,
      dateFin,
      creerParId: auth.userId,
      lundi: Boolean(payload.lundi),
      mardi: Boolean(payload.mardi),
      mercredi: Boolean(payload.mercredi),
      jeudi: Boolean(payload.jeudi),
      vendredi: Boolean(payload.vendredi),
      samedi: Boolean(payload.samedi),
      dimanche: Boolean(payload.dimanche),
    },
  });

  return NextResponse.json({ data: created }, { status: 201 });
}

export async function PUT(req: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non authentifie" }, { status: 401 });
  }

  try {
    await requireAccess({
      permissions: ["horaire_agent.update", "horaire_agent.assign"],
    });
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const payload = await req.json();
  const id = Number(payload.id);
  const agentId = Number(payload.agentId);
  const horaireId = Number(payload.horaireId);
  const dateDebut = toDateOnly(payload.dateDebut);
  const dateFin = payload.dateFin ? toDateOnly(payload.dateFin) : null;
  const todayStart = getTodayStart();

  if (!id || !agentId || !horaireId || !dateDebut) {
    return NextResponse.json(
      { message: "id, agentId, horaireId et dateDebut sont requis" },
      { status: 400 }
    );
  }

  if (dateDebut < todayStart) {
    return NextResponse.json(
      { message: "dateDebut doit etre aujourd'hui ou dans le futur" },
      { status: 400 }
    );
  }

  if (dateFin && dateFin < todayStart) {
    return NextResponse.json(
      { message: "dateFin doit etre aujourd'hui ou dans le futur" },
      { status: 400 }
    );
  }

  if (dateFin && dateFin < dateDebut) {
    return NextResponse.json(
      { message: "dateFin doit etre superieure ou egale a dateDebut" },
      { status: 400 }
    );
  }

  const updated = await prisma.horaireAgent.update({
    where: { id },
    data: {
      agentId,
      horaireId,
      dateDebut,
      dateFin,
      creerParId: auth.userId,
      lundi: Boolean(payload.lundi),
      mardi: Boolean(payload.mardi),
      mercredi: Boolean(payload.mercredi),
      jeudi: Boolean(payload.jeudi),
      vendredi: Boolean(payload.vendredi),
      samedi: Boolean(payload.samedi),
      dimanche: Boolean(payload.dimanche),
    },
  });

  return NextResponse.json({ data: updated }, { status: 200 });
}

export async function DELETE(req: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non authentifie" }, { status: 401 });
  }

  try {
    await requireAccess({
      permissions: ["horaire_agent.delete"],
    });
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const payload = await req.json();
  const id = Number(payload.id);
  if (!id) {
    return NextResponse.json({ message: "id requis" }, { status: 400 });
  }

  await prisma.horaireAgent.delete({ where: { id } });
  return NextResponse.json({ success: true }, { status: 200 });
}

