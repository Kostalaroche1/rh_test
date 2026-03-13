import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { modifierAgent } from "@/app/application/agent/modifierAgent";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import { generateMatricule } from "@/services/generateMat";

async function ensureAgentAccess(permission: string) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return { response: NextResponse.json({ message: "Non authentifie" }, { status: 401 }) };
  }

  try {
    await requireAccess({
      permissions: [permission],
    });
  } catch {
    return { response: NextResponse.json({ message: "Acces interdit" }, { status: 403 }) };
  }

  return { response: null };
}

export async function GET() {
  const guard = await ensureAgentAccess("agent.read");
  if (guard.response) return guard.response;

  const datas = await prisma.utilisateur.findMany({
    select: {
      id: true,
      login: true,
      actif: true,
      roles: true,
      compteAgent: {
        select: {
          agent: true,
          agentId: true,
          liePar: true,
          utilisateurId: true,
          id: true,
          dateLiaison: true,
        },
      },
    },
  });

  return NextResponse.json({ status: 200, data: datas }, { status: 200 });
}

export async function POST(req: Request) {
  const guard = await ensureAgentAccess("agent.create");
  if (guard.response) return guard.response;

  try {
    const data = await req.json();
    await prisma.agent.create({
      data: {
        matricule: generateMatricule(),
        nom: `${data.nom ?? ""} ${data.postnom ?? ""}`.trim(),
        prenom: data.prenom,
        statut: data.statut,
        dateEntree: new Date(data.dateEntree),
      },
    });

    return NextResponse.json(
      { status: 200, message: "Agent ajoute avec succes" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: 500, error, message: "Agent non ajoute" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const guard = await ensureAgentAccess("agent.update");
  if (guard.response) return guard.response;

  const data = await req.json();

  await prisma.agent.update({
    where: { id: Number(data.agentId) },
    data: {
      nom: data.nom,
      prenom: data.prenom,
      statut: data.statut,
    },
  });

  const utilisateurRole = await prisma.utilisateurRole.findFirst({
    where: { utilisateurId: Number(data.utilisateurId) },
  });

  if (utilisateurRole && data?.roleId != null) {
    await prisma.utilisateurRole.update({
      where: { id: utilisateurRole.id },
      data: { roleId: Number(data.roleId) },
    });
  }

  return NextResponse.json({ status: 200 }, { status: 200 });
}

export async function DELETE(req: Request) {
  const guard = await ensureAgentAccess("agent.delete");
  if (guard.response) return guard.response;

  const data = await req.json();
  const agentId = Number(data?.agentId);
  const utilisateurId = Number(data?.utilisateurId);

  if (!Number.isFinite(agentId) || !Number.isFinite(utilisateurId)) {
    return NextResponse.json({ error: "agentId ou utilisateurId manquant" }, { status: 400 });
  }

  await prisma.compteAgent.deleteMany({
    where: { agentId },
  });

  await prisma.agent.delete({
    where: { id: agentId },
  });

  const utilisateurRole = await prisma.utilisateurRole.findFirst({
    where: { utilisateurId },
  });

  if (utilisateurRole) {
    await prisma.utilisateurRole.delete({
      where: { id: utilisateurRole.id },
    });
  }

  await prisma.utilisateur.delete({
    where: { id: utilisateurId },
  });

  return NextResponse.json({ status: 200 }, { status: 200 });
}

