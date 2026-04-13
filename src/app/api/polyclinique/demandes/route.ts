import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import {
  getCurrentSessionAgentId,
  getPolycliniqueCapabilities,
  getPolycliniqueScopeAgentIds,
} from "@/server/polyclinique/access";

function parseStatus(raw: string | null) {
  if (!raw) return null;
  const value = raw.trim().toUpperCase();
  if (
    value === "EN_ATTENTE" ||
    value === "VALIDEE_DRH" ||
    value === "REJETEE_DRH" ||
    value === "DOSSIER_ETABLI"
  ) {
    return value;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ status: 401, message: "Non authentifie" }, { status: 401 });
    }

    const capabilities = getPolycliniqueCapabilities(user);
    if (!capabilities.canAccess) {
      return NextResponse.json({ status: 403, message: "Acces interdit" }, { status: 403 });
    }

    const [currentAgentId, scopedAgentIds] = await Promise.all([
      getCurrentSessionAgentId(user),
      getPolycliniqueScopeAgentIds(user),
    ]);

    const status = parseStatus(request.nextUrl.searchParams.get("statut"));
    const mineOnly = request.nextUrl.searchParams.get("mine") === "1";

    const where: Prisma.DemandeSoinPolycliniqueWhereInput = {};

    if (status) {
      where.statut = status;
    }

    if (mineOnly && currentAgentId) {
      where.agentId = currentAgentId;
    } else if (scopedAgentIds === null) {
      // Full access by scope.
    } else {
      where.agentId = {
        in: scopedAgentIds.length ? scopedAgentIds : [-1],
      };
    }

    const demandes = await prisma.demandeSoinPolyclinique.findMany({
      where,
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
      orderBy: [{ dateDemande: "desc" }],
      take: 120,
    });

    return NextResponse.json({ status: 200, data: demandes }, { status: 200 });
  } catch (error) {
    console.error("GET /api/polyclinique/demandes failed:", error);
    return NextResponse.json(
      { status: 500, message: "Erreur lors du chargement des demandes de soin." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ status: 401, message: "Non authentifie" }, { status: 401 });
    }

    const capabilities = getPolycliniqueCapabilities(user);
    if (!capabilities.canRequest) {
      return NextResponse.json(
        { status: 403, message: "Permission insuffisante pour creer une demande de soin." },
        { status: 403 }
      );
    }

    const currentAgentId = await getCurrentSessionAgentId(user);
    if (!currentAgentId) {
      return NextResponse.json(
        {
          status: 400,
          message: "Aucun agent n'est lie a votre compte. Contactez l'administration RH.",
        },
        { status: 400 }
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { motif?: string; symptomes?: string }
      | null;

    const motif = String(body?.motif ?? "").trim();
    const symptomes = String(body?.symptomes ?? "").trim();

    if (!motif) {
      return NextResponse.json(
        { status: 400, message: "Le motif de la demande de soin est obligatoire." },
        { status: 400 }
      );
    }

    const created = await prisma.demandeSoinPolyclinique.create({
      data: {
        agentId: currentAgentId,
        motif,
        symptomes: symptomes || null,
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
      },
    });

    return NextResponse.json(
      {
        status: 200,
        message: "Demande de soin enregistree. En attente de validation DRH.",
        data: created,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/polyclinique/demandes failed:", error);
    return NextResponse.json(
      { status: 500, message: "Erreur lors de la creation de la demande de soin." },
      { status: 500 }
    );
  }
}
