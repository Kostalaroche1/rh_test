import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import prisma from "@/lib/prisma";
import { notifyLogin } from "@/server/services/notification.service";

const JWT_SECRET = process.env.JWT_SECRET!;

function shouldUseSecureCookie(req: Request): boolean {
  const envOverride = process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase();
  if (envOverride === "true") return true;
  if (envOverride === "false") return false;

  const forwardedProto = req.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    ?.toLowerCase();

  if (forwardedProto) {
    return forwardedProto === "https";
  }

  try {
    const protocol = new URL(req.url).protocol;
    return protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const { login, motDePasse } = await req.json();

  const user = await prisma.utilisateur.findUnique({
    where: { login },
    include: {
      roles: { include: { role: true } },
      compteAgent: {
        include: {
          agent: true,
          utilisateur: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ message: "Identifiants invalides" }, { status: 401 });
  }

  const compteActif = user.compteAgent?.utilisateur?.actif ?? user.actif;
  const hasActiveRole = user.roles.some((item) => item.role?.actif);

  if (!compteActif || !user.actif) {
    return NextResponse.json(
      { message: "Ce compte est desactive. Contactez le RH." },
      { status: 401 }
    );
  }

  if (!hasActiveRole) {
    return NextResponse.json(
      { message: "Aucun role actif n'est associe a ce compte." },
      { status: 401 }
    );
  }

  const isValid = await bcrypt.compare(motDePasse, user.motDePasse);
  if (!isValid) {
    return NextResponse.json(
      { message: "Mot de passe ou nom d'utilisateur incorrect." },
      { status: 401 }
    );
  }

  const lastRole = user.roles[user.roles.length - 1];
  const tokenPayload = {
    userId: user.id,
    compteId: user.compteAgent?.id ?? null,
    nom: user.compteAgent?.agent?.nom ?? "",
    prenom: user.compteAgent?.agent?.prenom ?? "",
    matricule: user.compteAgent?.agent?.matricule ?? "",
    email: user.login,
    role: user.roles,
    roleId: lastRole?.role?.id ?? null,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "1d" });

  const response = NextResponse.json({
    id: user.id,
    compteId: user.compteAgent?.id ?? null,
    login: user.login,
    status: 200,
    message: "Authentification reussie",
  });

  response.cookies.set("auth_token", token, {
    httpOnly: true,
    secure: shouldUseSecureCookie(req),
    sameSite: "strict",
    path: "/",
  });

  try {
    await notifyLogin(tokenPayload);
  } catch (error) {
    console.error("Login notification failed:", error);
  }

  return response;
}
