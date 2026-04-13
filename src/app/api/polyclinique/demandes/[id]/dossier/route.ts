import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { POLYCLINIQUE_PERMISSION } from "@/polyclinique/permissions";
import { getAuthenticatedUser } from "@/security/auth";
import { canAccessAgentForPermissions } from "@/server/access/scope";
import { getPolycliniqueCapabilities } from "@/server/polyclinique/access";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ status: 401, message: "Non authentifie" }, { status: 401 });
    }

    const capabilities = getPolycliniqueCapabilities(user);
    if (!capabilities.canCreateDossier) {
      return NextResponse.json(
        {
          status: 403,
          message: "Permission insuffisante pour etablir un dossier medical.",
        },
        { status: 403 }
      );
    }

    const { id: rawId } = await params;
    const demandeId = Number(rawId);
    if (!Number.isFinite(demandeId)) {
      return NextResponse.json({ status: 400, message: "Identifiant invalide." }, { status: 400 });
    }

    const body = (await request.json().catch(() => null)) as
      | {
          resumeTraitements?: string;
          traitementsSuivis?: string;
          observations?: string;
          fichierPath?: string;
        }
      | null;

    const resumeTraitements = String(body?.resumeTraitements ?? "").trim();
    const traitementsSuivis = String(body?.traitementsSuivis ?? "").trim();
    const observations = String(body?.observations ?? "").trim();
    const fichierPath = String(body?.fichierPath ?? "").trim();

    if (!resumeTraitements) {
      return NextResponse.json(
        { status: 400, message: "Le resume des traitements est obligatoire." },
        { status: 400 }
      );
    }

    const demande = await prisma.demandeSoinPolyclinique.findUnique({
      where: { id: demandeId },
      include: {
        dossierMedical: {
          select: { id: true },
        },
      },
    });

    if (!demande) {
      return NextResponse.json(
        { status: 404, message: "Demande de soin introuvable." },
        { status: 404 }
      );
    }

    const canAccess = await canAccessAgentForPermissions(user.userId, demande.agentId, [
      POLYCLINIQUE_PERMISSION.DOSSIER_CREATE,
    ]);
    if (!canAccess) {
      return NextResponse.json({ status: 403, message: "Acces interdit." }, { status: 403 });
    }

    if (demande.statut !== "VALIDEE_DRH") {
      return NextResponse.json(
        {
          status: 409,
          message:
            "Le dossier medical ne peut etre cree qu'apres validation DRH de la demande.",
        },
        { status: 409 }
      );
    }

    if (demande.dossierMedical) {
      return NextResponse.json(
        { status: 409, message: "Un dossier medical existe deja pour cette demande." },
        { status: 409 }
      );
    }

    const dossier = await prisma.$transaction(async (tx) => {
      const created = await tx.dossierMedicalPolyclinique.create({
        data: {
          demandeSoinId: demande.id,
          agentId: demande.agentId,
          medecinUtilisateurId: user.userId,
          resumeTraitements,
          traitementsSuivis: traitementsSuivis || null,
          observations: observations || null,
          fichierPath: fichierPath || null,
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
          medecinUtilisateur: {
            select: {
              id: true,
              login: true,
              compteAgent: {
                select: {
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
                },
              },
            },
          },
        },
      });

      await tx.demandeSoinPolyclinique.update({
        where: { id: demande.id },
        data: { statut: "DOSSIER_ETABLI" },
      });

      return created;
    });

    return NextResponse.json(
      {
        status: 200,
        message: "Dossier medical etabli et ajoute au dossier agent.",
        data: dossier,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/polyclinique/demandes/[id]/dossier failed:", error);
    return NextResponse.json(
      { status: 500, message: "Erreur lors de la creation du dossier medical." },
      { status: 500 }
    );
  }
}
