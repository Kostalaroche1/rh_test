import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import { getAgentIdFromUtilisateurId } from "@/server/horaireAgent";
import { canAccessAgentForPermissions } from "@/server/access/scope";

async function ensureCongeAccess(options: {
  permission: string;
}) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { auth: null, response: NextResponse.json({ message: "Non autorise" }, { status: 401 }) };
  }

  try {
    await requireAccess({
      permissions: [options.permission],
    });
  } catch {
    return { auth: null, response: NextResponse.json({ message: "Acces interdit" }, { status: 403 }) };
  }

  return { auth, response: null };
}

export async function POST(req: NextRequest) {
  const guard = await ensureCongeAccess({
    permission: "demande_conge.request",
  });
  if (guard.response) return guard.response;

  const body = await req.json();
  const agentId = await getAgentIdFromUtilisateurId(guard.auth!.userId);

  if (!agentId) {
    return NextResponse.json({ message: "Agent introuvable" }, { status: 404 });
  }

  const typeCongeId = Number(body?.typeCongeId);
  if (!Number.isFinite(typeCongeId)) {
    return NextResponse.json({ message: "typeCongeId invalide" }, { status: 400 });
  }

  const result = await prisma.demandeConge.create({
    data: {
      agentId,
      typeCongeId,
      dateDemande: new Date(body?.dateDemande),
      dateDebut: new Date(body?.dateDebut),
      dateFin: new Date(body?.dateFin),
      motif: body?.motif ?? null,
    },
  });

  return NextResponse.json({ status: 200, result }, { status: 200 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const id = Number(body?.id);
  const action = String(body?.action ?? "update_own").trim();

  if (!Number.isFinite(id)) {
    return NextResponse.json({ message: "id invalide" }, { status: 400 });
  }

  const demande = await prisma.demandeConge.findUnique({
    where: { id },
    include: { agent: true, typeConge: true },
  });

  if (!demande) {
    return NextResponse.json({ message: "Demande introuvable" }, { status: 404 });
  }

  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non autorise" }, { status: 401 });
  }

  const actorAgentId = await getAgentIdFromUtilisateurId(auth.userId);
  const ownsRequest = actorAgentId === demande.agentId;

  if (action === "validate") {
    const guard = await ensureCongeAccess({
      permission: "demande_conge.validate",
    });
    if (guard.response) return guard.response;

    if (demande.statut === "EN_ATTENTE") {
      return NextResponse.json(
        { message: "La demande doit etre confirmee avant validation" },
        { status: 400 }
      );
    }

    if (!(await canAccessAgentForPermissions(auth.userId, demande.agentId, ["demande_conge.validate"]))) {
      return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
    }

    const result = await prisma.demandeConge.update({
      where: { id },
      data: {
        statut: body?.statut,
        validePar: guard.auth!.userId,
        dateValidation: new Date(),
      },
    });

    return NextResponse.json({
      status: 200,
      message: `Vous avez ${body?.statut} cette demande de conge`,
      result,
    });
  }

  if (action === "confirm") {
    const guard = await ensureCongeAccess({
      permission: "demande_conge.confirm",
    });
    if (guard.response) return guard.response;

    if (!(await canAccessAgentForPermissions(auth.userId, demande.agentId, ["demande_conge.confirm"]))) {
      return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
    }

    const result = await prisma.demandeConge.update({
      where: { id },
      data: {
        statut: body?.statut,
        confirmePar: guard.auth!.userId,
      },
    });

    return NextResponse.json({
      status: 200,
      message: `Vous avez ${body?.statut} cette demande de conge`,
      result,
    });
  }

  if (!ownsRequest) {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const guard = await ensureCongeAccess({
    permission: "demande_conge.update",
  });
  if (guard.response) return guard.response;

  const result = await prisma.demandeConge.update({
    where: { id },
    data: {
      typeConge: {
        connect: { id: Number(body?.typeConge?.id ?? body?.typeCongeId) },
      },
      dateDemande: new Date(body?.dateDemande),
      dateDebut: new Date(body?.dateDebut),
      dateFin: new Date(body?.dateFin),
      motif: body?.motif ?? null,
      statut: body?.statut,
    },
  });

  return NextResponse.json({
    status: 200,
    message: `Vous avez ${body?.statut} cette demande de conge`,
    result,
  });
}

export async function GET() {
  const guard = await ensureCongeAccess({
    permission: "demande_conge.read",
  });
  if (guard.response) return guard.response;

  const agentId = await getAgentIdFromUtilisateurId(guard.auth!.userId);
  if (!agentId) {
    return NextResponse.json({ status: 200, getData: [] }, { status: 200 });
  }

  const getData = await prisma.demandeConge.findMany({
    where: { agentId },
    include: {
      typeConge: true,
      agent: true,
    },
    orderBy: [{ dateDemande: "desc" }, { id: "desc" }],
  });

  return NextResponse.json({ status: 200, getData }, { status: 200 });
}

export async function DELETE(req: Request) {
  const guard = await ensureCongeAccess({
    permission: "demande_conge.delete",
  });
  if (guard.response) return guard.response;

  const body = await req.json();
  const id = Number(body?.id);
  const agentId = await getAgentIdFromUtilisateurId(guard.auth!.userId);

  if (!Number.isFinite(id) || !agentId) {
    return NextResponse.json({ message: "Suppression impossible" }, { status: 400 });
  }

  const demande = await prisma.demandeConge.findUnique({
    where: { id },
    select: { id: true, agentId: true },
  });

  if (!demande || demande.agentId !== agentId) {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const result = await prisma.demandeConge.delete({
    where: { id },
  });

  return NextResponse.json({ status: 200, result }, { status: 200 });
}

