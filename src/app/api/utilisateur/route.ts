import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";
import { requireAccess } from "@/security/authorization";
import { getAuthenticatedUser } from "@/security/auth";
import { getAccessibleAgentIdsForPermissions } from "@/server/access/scope";

type CreateUserPayload = {
  login?: string;
  motDePasse?: string;
};

type UpdateUserPayload = {
  id?: unknown;
  data?: {
    login?: string;
    motDePasse?: string;
    actif?: boolean;
  };
};

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non authentifie" }, { status: 401 });
  }

  try {
    await requireAccess({
      permissions: ["user.read"],
    });
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const accessibleAgentIds = await getAccessibleAgentIdsForPermissions(auth.userId, [
    "user.read",
    "agent.read",
  ]);

  const users = await prisma.utilisateur.findMany({
    where:
      accessibleAgentIds === null
        ? undefined
        : {
            OR: [
              {
                compteAgent: {
                  is: {
                    agentId: {
                      in: accessibleAgentIds.length ? accessibleAgentIds : [-1],
                    },
                  },
                },
              },
              { id: auth.userId },
            ],
          },
    include: {
      roles: { include: { role: true } },
      compteAgent: {
        select: {
          id: true,
          utilisateur: true,
          agent: {
            select: {
              matricule: true,
              id: true,
              nom: true,
              prenom: true,
              statut: true,
              genre: true,
              actif: true,
            },
          },
        },
      },
    },
  });
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non authentifie" }, { status: 401 });
  }

  try {
    await requireAccess({
      permissions: ["user.create"],
    });
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const data = (await req.json()) as CreateUserPayload;
  const login = data.login?.trim();
  const motDePasse = data.motDePasse?.trim();

  if (!login || !motDePasse) {
    return NextResponse.json(
      { message: "login et motDePasse sont requis" },
      { status: 400 }
    );
  }

  const roleUtilisateur = await prisma.role.findFirst({
    where: {
      OR: [{ nom: "Utilisateur" }, { key: "utilisateur" }],
      actif: true,
    },
    orderBy: { id: "asc" },
  });

  if (!roleUtilisateur) {
    return NextResponse.json(
      { message: "Role utilisateur introuvable" },
      { status: 400 }
    );
  }

  const exists = await prisma.utilisateur.findUnique({ where: { login } });
  if (exists) {
    return NextResponse.json(
      { message: "Ce login existe deja" },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(motDePasse, 10);
  const created = await prisma.$transaction(async (tx) => {
    const utilisateur = await tx.utilisateur.create({
      data: {
        login,
        motDePasse: hashedPassword,
        actif: true,
      },
    });

    await tx.utilisateurRole.create({
      data: {
        utilisateurId: utilisateur.id,
        roleId: roleUtilisateur.id,
        attribuePar: auth.userId,
      },
    });

    return utilisateur;
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
      permissions: ["user.update"],
    });
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const payload = (await req.json()) as UpdateUserPayload;
  const id = Number(payload?.id);
  const data = payload?.data;

  if (!Number.isInteger(id) || id <= 0 || !data || typeof data !== "object") {
    return NextResponse.json(
      { message: "id et data sont requis" },
      { status: 400 }
    );
  }

  if ("actif" in data && data.actif !== undefined && typeof data.actif !== "boolean") {
    return NextResponse.json(
      { message: "Le champ actif doit etre un booleen" },
      { status: 400 }
    );
  }

  const existing = await prisma.utilisateur.findUnique({
    where: { id },
    select: {
      id: true,
      compteAgent: {
        select: {
          agentId: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ message: "Utilisateur introuvable" }, { status: 404 });
  }

  const user = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.utilisateur.update({
      where: { id },
      data,
    });

    // Synchronise l'etat du profil agent avec l'etat du compte utilisateur.
    if (typeof data.actif === "boolean" && existing.compteAgent?.agentId) {
      await tx.agent.updateMany({
        where: { id: existing.compteAgent.agentId },
        data: { actif: data.actif },
      });
    }

    return updatedUser;
  });

  return NextResponse.json(user);
}

