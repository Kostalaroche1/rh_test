import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import { getAccessibleAgentIdsForPermissions } from "@/server/access/scope";
import {
  readBiometricReferencesCache,
  writeBiometricReferencesCache,
} from "@/server/biometrie/references-cache";

function normalizeDescriptor(value: unknown) {
  if (!Array.isArray(value) || value.length !== 128) {
    return null;
  }

  const normalized = value
    .map((entry) => Number(entry))
    .filter((entry) => Number.isFinite(entry));

  if (normalized.length !== 128) {
    return null;
  }

  return normalized;
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

  const cached = readBiometricReferencesCache(auth.userId);
  if (cached) {
    return NextResponse.json(
      {
        data: cached.data,
        hasReferences: cached.data.length > 0,
        cacheSource: "memory",
        cacheTtlMs: cached.ttlMs,
      },
      { status: 200 }
    );
  }

  const accessibleAgentIds = await getAccessibleAgentIdsForPermissions(auth.userId, [
    "presence.biometric",
    "presence.sign",
  ]);

  const agents = await prisma.agent.findMany({
    where: {
      actif: true,
      ...(accessibleAgentIds === null
        ? {}
        : { id: { in: accessibleAgentIds.length ? accessibleAgentIds : [-1] } }),
    },
    select: {
      id: true,
      matricule: true,
      nom: true,
      prenom: true,
      biometricReferences: {
        where: { actif: true },
        select: {
          descriptor: true,
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      },
    },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });

  const data = agents
    .map((agent) => {
      const descriptors = agent.biometricReferences
        .map((reference) => normalizeDescriptor(reference.descriptor))
        .filter((descriptor): descriptor is number[] => Array.isArray(descriptor));

      return {
        agentId: agent.id,
        matricule: agent.matricule,
        nom: agent.nom,
        prenom: agent.prenom,
        fullName: `${agent.nom} ${agent.prenom}`.trim(),
        descriptors,
      };
    })
    .filter((agent) => agent.descriptors.length > 0);

  writeBiometricReferencesCache(auth.userId, data);

  return NextResponse.json(
    {
      data,
      hasReferences: data.length > 0,
      cacheSource: "database",
    },
    { status: 200 }
  );
}
