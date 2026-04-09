import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { hasAnyPermission } from "@/security/permissions";
import { canAccessAgent, getCurrentAgentId } from "@/server/access/context";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function sanitizeSegment(value: unknown) {
  const normalized = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "agent";
}

function resolveExtension(file: File) {
  const mime = String(file.type ?? "").toLowerCase();
  if (mime === "image/jpeg" || mime === "image/jpg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";

  const fileName = String(file.name ?? "");
  const ext = fileName.includes(".") ? fileName.split(".").pop() ?? "" : "";
  const cleanExt = ext.toLowerCase().replace(/[^a-z0-9]/g, "");
  return cleanExt || "jpg";
}

function buildEncryptedAgentToken(agentId: number) {
  const secret =
    process.env.AGENT_PHOTO_SECRET?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    "agent-photo-secret";
  return createHash("sha256")
    .update(`${secret}:${agentId}`)
    .digest("hex")
    .slice(0, 14);
}

function sanitizeFolder(value: unknown) {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return null;
  if (!/^[a-z0-9-]+$/.test(normalized)) return null;
  return normalized;
}

function extractFolderFromStoredPhoto(photo: string | null | undefined) {
  const raw = String(photo ?? "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw) || raw.startsWith("/")) return null;
  const [folder] = raw.split("/");
  return sanitizeFolder(folder);
}

function buildTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const milliseconds = String(now.getMilliseconds()).padStart(3, "0");
  const nonce = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `${year}${month}${day}-${hours}${minutes}${seconds}-${milliseconds}-${nonce}`;
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ message: "Non autorise" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("photo");
    const incomingAgentId = Number(formData.get("agentId"));
    const currentAgentId = await getCurrentAgentId(user);

    const targetAgentId = Number.isInteger(incomingAgentId) && incomingAgentId > 0
      ? incomingAgentId
      : currentAgentId;

    if (!targetAgentId) {
      return NextResponse.json(
        { message: "Aucun profil agent lie a ce compte." },
        { status: 400 }
      );
    }

    const canUpdateOthers = hasAnyPermission(user, ["agent.update"]);
    const isSelfUpdate = currentAgentId != null && currentAgentId === targetAgentId;
    if (!isSelfUpdate && !canUpdateOthers) {
      return NextResponse.json(
        { message: "Vous ne pouvez modifier que votre propre photo." },
        { status: 403 }
      );
    }

    const allowed = await canAccessAgent(user, targetAgentId);
    if (!allowed) {
      return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Le fichier photo est obligatoire." },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json({ message: "Fichier vide." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { message: "La photo depasse la taille maximale de 5 Mo." },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.has(String(file.type ?? "").toLowerCase())) {
      return NextResponse.json(
        { message: "Format non supporte. Utilisez JPG, PNG, WEBP ou GIF." },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.findUnique({
      where: { id: targetAgentId },
      select: {
        id: true,
        nom: true,
        photo: true,
      },
    });

    if (!agent) {
      return NextResponse.json({ message: "Agent introuvable." }, { status: 404 });
    }

    const existingFolder = extractFolderFromStoredPhoto(agent.photo);
    const stableFolder =
      existingFolder ||
      `${buildEncryptedAgentToken(agent.id)}-${sanitizeSegment(agent.nom)}`;

    const extension = resolveExtension(file);
    const fileName = `${sanitizeSegment(agent.nom)}-${buildTimestamp()}.${extension}`;
    const relativePath = `${stableFolder}/${fileName}`;

    const absoluteDirectory = path.join(
      process.cwd(),
      "public",
      "agent-photos",
      stableFolder
    );
    const absoluteFilePath = path.join(absoluteDirectory, fileName);

    await mkdir(absoluteDirectory, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(absoluteFilePath, Buffer.from(bytes));

    const updatedAgent = await prisma.agent.update({
      where: { id: targetAgentId },
      data: {
        photo: relativePath,
      },
      select: {
        id: true,
        photo: true,
      },
    });

    return NextResponse.json(
      {
        data: {
          id: updatedAgent.id,
          photo: updatedAgent.photo,
          photoUrl: `/agent-photos/${updatedAgent.photo}`,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/agent/photo failed:", error);
    return NextResponse.json(
      { message: "Erreur lors de l'enregistrement de la photo." },
      { status: 500 }
    );
  }
}
