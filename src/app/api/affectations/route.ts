import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import { notifyCompteAndRoles } from "@/server/services/notification.service";
import { canAccessAgentForPermissions, canAccessUnitForPermissions, getAccessibleAgentIdsForPermissions } from "@/server/access/scope";

async function ensureAffectationAccess(permission: string) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { ok: false as const, response: NextResponse.json({ message: "Non autorise" }, { status: 401 }) };
  }
  try {
    await requireAccess({
      permissions: [permission],
    });
  } catch {
    return { ok: false as const, response: NextResponse.json({ message: "Acces refuse" }, { status: 403 }) };
  }
  return { ok: true as const, auth };
}

export async function GET() {
  const guard = await ensureAffectationAccess("affectation.read");
  if (!guard.ok) return guard.response;

  const accessibleAgentIds = await getAccessibleAgentIdsForPermissions(guard.auth!.userId, [
    "affectation.read",
  ]);

  const data = await prisma.affectation.findMany({
    where:
      accessibleAgentIds === null
        ? undefined
        : {
            agentId: { in: accessibleAgentIds.length ? accessibleAgentIds : [-1] },
          },
    include: {
      agent: true,
      poste: true,
      fonction: true,
      grade: true,
      uniteOrganisationnelle: true,
      historique: true,
    },
    orderBy: { dateDebut: "desc" },
  });

  return NextResponse.json({ data }, { status: 200 });
}

export async function POST(req: Request) {
  const guard = await ensureAffectationAccess("affectation.assign");
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const agentId = Number(body.agentId);
  const uniteOrganisationnelleId = Number(body.uniteOrganisationnelleId);

  if (!(await canAccessAgentForPermissions(guard.auth!.userId, agentId, ["affectation.assign"]))) {
    return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
  }

  if (typeof uniteOrganisationnelleId === "number" && Number.isFinite(uniteOrganisationnelleId)) {
    const canAccessUnit = await canAccessUnitForPermissions(
      guard.auth!.userId,
      uniteOrganisationnelleId,
      ["unite_organisationnelle.read", "affectation.assign"]
    );

    if (!canAccessUnit) {
      return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
    }
  }

  const targetUnit = await prisma.uniteOrganisationnelle.findUnique({
    where: { id: uniteOrganisationnelleId },
    select: { id: true, provinceId: true },
  });

  if (!targetUnit) {
    return NextResponse.json({ message: "Unite introuvable" }, { status: 404 });
  }

  const active = await prisma.affectation.findFirst({
    where: {
      agentId,
      dateFin: null,
    },
  });

  if (active) {
    await prisma.affectation.update({
      where: { id: active.id },
      data: { dateFin: new Date() },
    });
  }

  const data = await prisma.affectation.create({
    data: {
      agentId,
      posteId: Number(body.posteId),
      fonctionId: body.fonctionId ? Number(body.fonctionId) : null,
      gradeId: Number(body.gradeId),
      uniteOrganisationnelleId,
      provinceId: targetUnit.provinceId ?? null,
      dateDebut: new Date(body.dateDebut),
      dateFin: body.dateFin ? new Date(body.dateFin) : null,
      motif: body.motif ?? null,
      type: body.type ?? "AFFECTATION",
      typeContrat: body.typeContrat ?? null,
      statutContrat: body.statutContrat ?? null,
      statut: body.statut ?? "EN_ATTENTE",
    },
    include: {
      agent: {
        include: {
          compte: { select: { id: true } },
        },
      },
      poste: true,
      grade: true,
      fonction: true,
      uniteOrganisationnelle: true,
      province: true,
    },
  });

  await notifyCompteAndRoles(
    data.agent?.compte?.id ?? null,
    ["admin", "rh"],
    {
      titre: "Nouvelle affectation",
      message: `${data.agent.nom} ${data.agent.prenom} est affecte(e) a ${data.poste?.libelle ?? "un poste"} (${data.uniteOrganisationnelle?.nom ?? "-"})`,
      type: "AFFECTATION",
      icon: "briefcase",
      url: "/dashboard/organisation",
    }
  );

  return NextResponse.json({ data }, { status: 201 });
}

export async function PUT(req: Request) {
  const guard = await ensureAffectationAccess("affectation.update");
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const existing = await prisma.affectation.findUnique({
    where: { id: Number(body.id) },
    select: { agentId: true, uniteOrganisationnelleId: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "Affectation introuvable" }, { status: 404 });
  }

  if (!(await canAccessAgentForPermissions(guard.auth!.userId, existing.agentId, ["affectation.update"]))) {
    return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
  }

  const uniteOrganisationnelleId = body.uniteOrganisationnelleId
    ? Number(body.uniteOrganisationnelleId)
    : undefined;

  const resolvedUniteOrganisationnelleId = Number.isFinite(uniteOrganisationnelleId)
    ? (uniteOrganisationnelleId as number)
    : existing.uniteOrganisationnelleId;

  const targetUnit = await prisma.uniteOrganisationnelle.findUnique({
    where: { id: resolvedUniteOrganisationnelleId },
    select: { id: true, provinceId: true },
  });

  if (!targetUnit) {
    return NextResponse.json({ message: "Unite introuvable" }, { status: 404 });
  }

  if (Number.isFinite(uniteOrganisationnelleId)) {
    const scopedUniteId = uniteOrganisationnelleId as number;
    const canAccessUnit = await canAccessUnitForPermissions(
      guard.auth!.userId,
      scopedUniteId,
      ["unite_organisationnelle.read", "affectation.update"]
    );

    if (!canAccessUnit) {
      return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
    }
  }

  const data = await prisma.affectation.update({
    where: { id: Number(body.id) },
    data: {
      posteId: Number(body.posteId),
      fonctionId: body.fonctionId ? Number(body.fonctionId) : null,
      gradeId: Number(body.gradeId),
      uniteOrganisationnelleId: Number.isFinite(uniteOrganisationnelleId) ? uniteOrganisationnelleId : undefined,
      provinceId: targetUnit.provinceId ?? null,
      dateDebut: new Date(body.dateDebut),
      dateFin: body.dateFin ? new Date(body.dateFin) : null,
      motif: body.motif ?? null,
      type: body.type ?? "AFFECTATION",
      typeContrat: body.typeContrat ?? null,
      statutContrat: body.statutContrat ?? null,
      statut: body.statut ?? undefined,
    },
    include: {
      agent: {
        include: {
          compte: { select: { id: true } },
        },
      },
      poste: true,
      uniteOrganisationnelle: true,
      province: true,
    },
  });

  await notifyCompteAndRoles(
    data.agent?.compte?.id ?? null,
    ["admin", "rh"],
    {
      titre: "Affectation modifiee",
      message: `Le parcours de ${data.agent.nom} ${data.agent.prenom} a ete mis a jour (${data.poste?.libelle ?? "poste"}).`,
      type: "AFFECTATION",
      icon: "refresh-cw",
      url: "/dashboard/organisation",
    }
  );

  return NextResponse.json({ data }, { status: 200 });
}

export async function DELETE(req: Request) {
  const guard = await ensureAffectationAccess("affectation.delete");
  if (!guard.ok) return guard.response;

  const body = await req.json();
  const existing = await prisma.affectation.findUnique({
    where: { id: Number(body.id) },
    select: { agentId: true },
  });

  if (!existing) {
    return NextResponse.json({ message: "Affectation introuvable" }, { status: 404 });
  }

  if (!(await canAccessAgentForPermissions(guard.auth!.userId, existing.agentId, ["affectation.delete"]))) {
    return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
  }

  await prisma.affectation.delete({
    where: { id: Number(body.id) },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}

