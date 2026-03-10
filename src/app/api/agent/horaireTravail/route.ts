import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { requireRole } from "@/security/authorization";

function timeToDate(time: string) {
  const [hoursRaw, minutesRaw] = time.split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
}

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non authentifie" }, { status: 401 });
  }

  try {
    await requireRole(["admin", "rh"]);
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const horaires = await prisma.horaireTravail.findMany({
    include: {
      _count: {
        select: { horaireAgent: true },
      },
      creerPar: {
        select: { id: true, login: true },
      },
    },
    orderBy: { id: "desc" },
  });

  return NextResponse.json({ data: horaires }, { status: 200 });
}

export async function POST(req: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non authentifie" }, { status: 401 });
  }

  try {
    await requireRole(["admin", "rh"]);
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const payload = await req.json();
  const nomHoraire = String(payload.nomHoraire ?? "").trim();
  const heureDebutRaw = String(payload.heureDebut ?? "").trim();
  const heureFinRaw = String(payload.heureFin ?? "").trim();

  if (!nomHoraire || !heureDebutRaw || !heureFinRaw) {
    return NextResponse.json(
      { message: "nomHoraire, heureDebut et heureFin sont requis" },
      { status: 400 }
    );
  }

  const heureDebut = timeToDate(heureDebutRaw);
  const heureFin = timeToDate(heureFinRaw);

  if (!heureDebut || !heureFin) {
    return NextResponse.json({ message: "Heure invalide" }, { status: 400 });
  }

  const horaire = await prisma.horaireTravail.create({
    data: {
      nomHoraire,
      heureDebut,
      heureFin,
      creerParId: auth.userId,
    },
  });

  return NextResponse.json({ data: horaire }, { status: 201 });
}

export async function PUT(req: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non authentifie" }, { status: 401 });
  }

  try {
    await requireRole(["admin", "rh"]);
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const payload = await req.json();
  const id = Number(payload.id);
  const nomHoraire = String(payload.nomHoraire ?? "").trim();
  const heureDebutRaw = String(payload.heureDebut ?? "").trim();
  const heureFinRaw = String(payload.heureFin ?? "").trim();

  if (!id || !nomHoraire || !heureDebutRaw || !heureFinRaw) {
    return NextResponse.json(
      { message: "id, nomHoraire, heureDebut et heureFin sont requis" },
      { status: 400 }
    );
  }

  const heureDebut = timeToDate(heureDebutRaw);
  const heureFin = timeToDate(heureFinRaw);
  if (!heureDebut || !heureFin) {
    return NextResponse.json({ message: "Heure invalide" }, { status: 400 });
  }

  const horaire = await prisma.horaireTravail.update({
    where: { id },
    data: {
      nomHoraire,
      heureDebut,
      heureFin,
      creerParId: auth.userId,
    },
  });

  return NextResponse.json({ data: horaire }, { status: 200 });
}

export async function DELETE(req: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non authentifie" }, { status: 401 });
  }

  try {
    await requireRole(["admin", "rh"]);
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const payload = await req.json();
  const id = Number(payload.id);
  if (!id) {
    return NextResponse.json({ message: "id requis" }, { status: 400 });
  }

  const linkedCount = await prisma.horaireAgent.count({
    where: { horaireId: id },
  });

  if (linkedCount > 0) {
    return NextResponse.json(
      {
        message:
          "Ce horaire est deja affecte a un ou plusieurs agents, suppression impossible",
      },
      { status: 409 }
    );
  }

  await prisma.horaireTravail.delete({ where: { id } });
  return NextResponse.json({ success: true }, { status: 200 });
}
