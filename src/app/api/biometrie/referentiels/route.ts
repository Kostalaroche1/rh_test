import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import {
  canAccessAgentForPermissions,
  getAccessibleAgentIdsForPermissions,
} from "@/server/access/scope";
import { invalidateBiometricReferencesCache } from "@/server/biometrie/references-cache";

const REQUIRED_ANGLE_CODES = ["front", "left", "right", "up"] as const;
type AngleCode = (typeof REQUIRED_ANGLE_CODES)[number];

const ANGLE_LABELS: Record<AngleCode, string> = {
  front: "Face",
  left: "Profil gauche",
  right: "Profil droit",
  up: "Leger haut/bas",
};

function normalizeDescriptor(input: unknown) {
  if (!Array.isArray(input) || input.length !== 128) {
    return null;
  }

  const normalized = input
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (normalized.length !== 128) {
    return null;
  }

  return normalized.map((value) => Number(value.toFixed(8)));
}

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non autorise" }, { status: 401 });
  }

  try {
    await requireAccess({ permissions: ["agent.read", "agent.update"] });
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const accessibleAgentIds = await getAccessibleAgentIdsForPermissions(auth.userId, [
    "agent.read",
    "agent.update",
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
          id: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });

  const data = agents.map((agent) => ({
    agentId: agent.id,
    matricule: agent.matricule,
    nom: agent.nom,
    prenom: agent.prenom,
    fullName: `${agent.nom} ${agent.prenom}`.trim(),
    referencesCount: agent.biometricReferences.length,
    lastReferenceAt: agent.biometricReferences[0]?.createdAt ?? null,
  }));

  return NextResponse.json({ data }, { status: 200 });
}

export async function POST(req: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non autorise" }, { status: 401 });
  }

  try {
    await requireAccess({ permissions: ["agent.update"] });
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const agentId = Number(formData.get("agentId"));
    const descriptorsRaw = formData.get("descriptors");

    if (!Number.isInteger(agentId) || agentId <= 0) {
      return NextResponse.json({ message: "agentId invalide." }, { status: 400 });
    }

    const allowed = await canAccessAgentForPermissions(auth.userId, agentId, ["agent.update"]);
    if (!allowed) {
      return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
    }

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
      },
    });

    if (!agent) {
      return NextResponse.json({ message: "Agent introuvable." }, { status: 404 });
    }

    if (typeof descriptorsRaw !== "string") {
      return NextResponse.json({ message: "Descriptors biometrques manquants." }, { status: 400 });
    }

    let parsedDescriptors: Array<{
      angleCode?: string;
      angleLabel?: string;
      descriptor?: unknown;
    }> = [];

    try {
      parsedDescriptors = JSON.parse(descriptorsRaw) as Array<{
        angleCode?: string;
        angleLabel?: string;
        descriptor?: unknown;
      }>;
    } catch {
      return NextResponse.json(
        { message: "Format JSON des descriptors invalide." },
        { status: 400 }
      );
    }

    if (!Array.isArray(parsedDescriptors) || parsedDescriptors.length !== REQUIRED_ANGLE_CODES.length) {
      return NextResponse.json(
        { message: "Il faut exactement 4 descriptors biometrques (angles requis)." },
        { status: 400 }
      );
    }

    const descriptorByAngle = new Map<AngleCode, number[]>();

    for (const entry of parsedDescriptors) {
      const angleCode = String(entry?.angleCode ?? "") as AngleCode;
      if (!REQUIRED_ANGLE_CODES.includes(angleCode)) {
        return NextResponse.json(
          { message: `Angle invalide dans descriptors: ${String(entry?.angleCode ?? "--")}.` },
          { status: 400 }
        );
      }

      const normalized = normalizeDescriptor(entry?.descriptor);
      if (!normalized) {
        return NextResponse.json(
          { message: `Descriptor invalide pour l'angle ${ANGLE_LABELS[angleCode]}.` },
          { status: 400 }
        );
      }

      descriptorByAngle.set(angleCode, normalized);
    }

    for (const angleCode of REQUIRED_ANGLE_CODES) {
      if (!descriptorByAngle.has(angleCode)) {
        return NextResponse.json(
          { message: `Descriptor manquant pour l'angle ${ANGLE_LABELS[angleCode]}.` },
          { status: 400 }
        );
      }
    }

    const records: Array<{
      agentId: number;
      angleCode: string;
      angleLabel: string;
      photoPath: string;
      descriptor: number[];
      actif: boolean;
    }> = [];

    for (const angleCode of REQUIRED_ANGLE_CODES) {
      const descriptor = descriptorByAngle.get(angleCode);
      if (!descriptor) {
        return NextResponse.json(
          { message: `Descriptor manquant pour l'angle ${ANGLE_LABELS[angleCode]}.` },
          { status: 400 }
        );
      }

      records.push({
        agentId: agent.id,
        angleCode,
        angleLabel: ANGLE_LABELS[angleCode],
        // Field kept for backward compatibility with current DB schema.
        photoPath: `descriptor-only/${agent.id}/${angleCode}`,
        descriptor,
        actif: true,
      });
    }

    await prisma.$transaction([
      prisma.biometricReference.deleteMany({ where: { agentId: agent.id } }),
      prisma.biometricReference.createMany({ data: records }),
    ]);
    invalidateBiometricReferencesCache();

    return NextResponse.json(
      {
        message: "Referentiel biometrque enregistre avec succes (descripteurs uniquement).",
        data: {
          agentId: agent.id,
          referencesCount: records.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("referentiels failed:", error);
    return NextResponse.json(
      { message: "Erreur lors de l'enregistrement du referentiel biometrque." },
      { status: 500 }
    );
  }
}
