import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import { getAccessibleAgentIdsForPermissions } from "@/server/access/scope";

function normalizePhotoPath(value: string) {
  return value.replace(/\\/g, "/").trim().replace(/^\/?public\//i, "");
}

function buildPhotoUrl(photo: string | null | undefined) {
  const raw = normalizePhotoPath(String(photo ?? ""));
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  if (raw.startsWith("/")) {
    return `/${raw.replace(/^\/+/, "")}`;
  }

  if (/^agent-photos\//i.test(raw)) {
    return `/${raw}`;
  }

  return `/agent-photos/${raw}`;
}

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non autorise" }, { status: 401 });
  }

  try {
    await requireAccess({ permissions: ["presence.biometric", "presence.sign"] });
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const accessibleAgentIds = await getAccessibleAgentIdsForPermissions(auth.userId, [
    "presence.biometric",
    "presence.sign",
  ]);

  const agents = await prisma.agent.findMany({
    where: {
      actif: true,
      AND: [{ photo: { not: null } }, { photo: { not: "" } }],
      ...(accessibleAgentIds === null
        ? {}
        : { id: { in: accessibleAgentIds.length ? accessibleAgentIds : [-1] } }),
    },
    select: {
      id: true,
      matricule: true,
      nom: true,
      prenom: true,
      photo: true,
    },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });

  const data = agents
    .map((agent) => ({
      agentId: agent.id,
      matricule: agent.matricule,
      nom: agent.nom,
      prenom: agent.prenom,
      fullName: `${agent.nom} ${agent.prenom}`.trim(),
      photoUrl: buildPhotoUrl(agent.photo),
    }))
    .filter((agent) => Boolean(agent.photoUrl));

  return NextResponse.json({ data }, { status: 200 });
}
