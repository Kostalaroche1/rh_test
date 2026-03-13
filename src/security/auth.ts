"use server";

import jwt, { type JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET!;

export type SessionRole = {
  id?: number;
  roleId?: number;
  actif?: boolean;
  role?: {
    id?: number;
    key?: string | null;
    nom?: string | null;
    actif?: boolean;
  };
};

export type SessionUser = JwtPayload & {
  userId: number;
  compteId?: number | null;
  nom?: string;
  prenom?: string;
  matricule?: string;
  email?: string;
  roleId?: number;
  role?: SessionRole[];
  permissions?: string[];
};

function isSessionUser(value: unknown): value is SessionUser {
  return typeof value === "object" && value !== null && "userId" in value;
}

export async function getAuthenticatedUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!isSessionUser(decoded)) return null;
    return decoded;
  } catch {
    return null;
  }
}
