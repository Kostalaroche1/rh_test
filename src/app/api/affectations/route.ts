import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import { notifyCompteAndRoles } from "@/server/services/notification.service";

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

  const data = await prisma.affectation.findMany({
    include: {
      agent: true,
      poste: true,
      fonction: true,
      grade: true,
      departement: true,
      direction: true,
      site: true,
      historique: true,
    },
    orderBy: { dateDebut: "desc" },
  });

  return NextResponse.json({ data }, { status: 200 });
}

export async function POST(req: Request) {
  const guard = await ensureAffectationAccess("affectation.create");
  if (!guard.ok) return guard.response;

  const body = await req.json();

  const active = await prisma.affectation.findFirst({
    where: {
      agentId: Number(body.agentId),
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
      agentId: Number(body.agentId),
      posteId: Number(body.posteId),
      fonctionId: body.fonctionId ? Number(body.fonctionId) : null,
      gradeId: Number(body.gradeId),
      departementId: Number(body.departementId),
      directionId: Number(body.directionId),
      siteId: Number(body.siteId),
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
      departement: true,
      direction: true,
      grade: true,
      fonction: true,
      site: true,
    },
  });

  await notifyCompteAndRoles(
    data.agent?.compte?.id ?? null,
    ["admin", "rh"],
    {
      titre: "Nouvelle affectation",
      message: `${data.agent.nom} ${data.agent.prenom} est affecte(e) a ${data.poste?.libelle ?? "un poste"} (${data.departement?.nom ?? "-"})`,
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

  const data = await prisma.affectation.update({
    where: { id: Number(body.id) },
    data: {
      posteId: Number(body.posteId),
      fonctionId: body.fonctionId ? Number(body.fonctionId) : null,
      gradeId: Number(body.gradeId),
      departementId: Number(body.departementId),
      directionId: Number(body.directionId),
      siteId: Number(body.siteId),
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
      departement: true,
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
  await prisma.affectation.delete({
    where: { id: Number(body.id) },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}

