import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";
import { modifierUtilisateur } from "@/app/application/utilisateur/modifierUtilisateur";
import { listerUtilisateurs } from "@/app/application/utilisateur/listerUtilisateurs";
import { requireRole } from "@/security/authorization";
import { getAuthenticatedUser } from "@/security/auth";

type CreateUserPayload = {
  login?: string;
  motDePasse?: string;
};

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non authentifie" }, { status: 401 });
  }

  try {
    await requireRole(["ADMIN", "RH"]);
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const users = await listerUtilisateurs();
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non authentifie" }, { status: 401 });
  }

  try {
    await requireRole(["ADMIN"]);
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
    await requireRole(["admin" , "rh"]);
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const { id, data } = await req.json();
  if (!id || !data) {
    return NextResponse.json(
      { message: "id et data sont requis" },
      { status: 400 }
    );
  }

  const user = await modifierUtilisateur(id, data);
  return NextResponse.json(user);
}
