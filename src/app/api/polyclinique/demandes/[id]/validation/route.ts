import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { POLYCLINIQUE_PERMISSION } from "@/polyclinique/permissions";
import { getAuthenticatedUser } from "@/security/auth";
import { canAccessAgentForPermissions } from "@/server/access/scope";
import { getPolycliniqueCapabilities } from "@/server/polyclinique/access";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ status: 401, message: "Non authentifie" }, { status: 401 });
    }

    const capabilities = getPolycliniqueCapabilities(user);
    if (!capabilities.canValidate) {
      return NextResponse.json(
        { status: 403, message: "Permission insuffisante pour valider les demandes de soin." },
        { status: 403 }
      );
    }

    const { id: rawId } = await params;
    const demandeId = Number(rawId);
    if (!Number.isFinite(demandeId)) {
      return NextResponse.json({ status: 400, message: "Identifiant invalide." }, { status: 400 });
    }

    const body = (await request.json().catch(() => null)) as
      | { decision?: "VALIDEE_DRH" | "REJETEE_DRH"; commentaireDecision?: string }
      | null;
    const decision = body?.decision;
    const commentaireDecision = String(body?.commentaireDecision ?? "").trim();

    if (decision !== "VALIDEE_DRH" && decision !== "REJETEE_DRH") {
      return NextResponse.json(
        {
          status: 400,
          message: "Decision invalide. Utilisez VALIDEE_DRH ou REJETEE_DRH.",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.demandeSoinPolyclinique.findUnique({
      where: { id: demandeId },
      select: {
        id: true,
        agentId: true,
        statut: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { status: 404, message: "Demande de soin introuvable." },
        { status: 404 }
      );
    }

    const canAccess = await canAccessAgentForPermissions(user.userId, existing.agentId, [
      POLYCLINIQUE_PERMISSION.DEMANDE_VALIDATE,
    ]);
    if (!canAccess) {
      return NextResponse.json({ status: 403, message: "Acces interdit." }, { status: 403 });
    }

    if (existing.statut !== "EN_ATTENTE") {
      return NextResponse.json(
        {
          status: 409,
          message:
            "Cette demande n'est plus en attente et ne peut pas etre revalidee.",
        },
        { status: 409 }
      );
    }

    const updated = await prisma.demandeSoinPolyclinique.update({
      where: { id: demandeId },
      data: {
        statut: decision,
        commentaireDecision: commentaireDecision || null,
        dateDecision: new Date(),
        valideParId: user.userId,
      },
      include: {
        agent: {
          select: {
            id: true,
            matricule: true,
            nom: true,
            prenom: true,
            statut: true,
            photo: true,
          },
        },
        validePar: {
          select: {
            id: true,
            login: true,
          },
        },
        dossierMedical: {
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        status: 200,
        message:
          decision === "VALIDEE_DRH"
            ? "Demande validee par la direction RH."
            : "Demande rejetee par la direction RH.",
        data: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/polyclinique/demandes/[id]/validation failed:", error);
    return NextResponse.json(
      { status: 500, message: "Erreur lors de la validation de la demande." },
      { status: 500 }
    );
  }
}
