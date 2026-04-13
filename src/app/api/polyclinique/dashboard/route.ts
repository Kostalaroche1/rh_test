import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import {
  getCurrentSessionAgentId,
  getPolycliniqueCapabilities,
  getPolycliniqueScopeAgentIds,
} from "@/server/polyclinique/access";

export async function GET() {
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

    const demandeWhere: Prisma.DemandeSoinPolycliniqueWhereInput | undefined =
      scopedAgentIds === null
        ? undefined
        : {
            agentId: {
              in: scopedAgentIds.length ? scopedAgentIds : [-1],
            },
          };

    const dossierWhere: Prisma.DossierMedicalPolycliniqueWhereInput | undefined =
      scopedAgentIds === null
        ? undefined
        : {
            agentId: {
              in: scopedAgentIds.length ? scopedAgentIds : [-1],
            },
          };

    const [connectedAgent, demandes, dossiersRecents] = await Promise.all([
      currentAgentId
        ? prisma.agent.findUnique({
            where: { id: currentAgentId },
            select: {
              id: true,
              matricule: true,
              nom: true,
              prenom: true,
              statut: true,
              photo: true,
            },
          })
        : Promise.resolve(null),
      prisma.demandeSoinPolyclinique.findMany({
        where: demandeWhere,
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
      }),
      capabilities.canReadDossier || capabilities.canCreateDossier
        ? prisma.dossierMedicalPolyclinique.findMany({
            where: dossierWhere,
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
            orderBy: [{ createdAt: "desc" }],
            take: 30,
          })
        : Promise.resolve([]),
    ]);

    const stats = {
      totalDemandes: demandes.length,
      enAttente: demandes.filter((item) => item.statut === "EN_ATTENTE").length,
      validees: demandes.filter((item) => item.statut === "VALIDEE_DRH").length,
      rejetees: demandes.filter((item) => item.statut === "REJETEE_DRH").length,
      dossiersMedicaux: demandes.filter((item) => Boolean(item.dossierMedical)).length,
    };

    const demandesEnAttenteValidation = capabilities.canValidate
      ? demandes.filter((item) => item.statut === "EN_ATTENTE")
      : [];

    const demandesValideesSansDossier = capabilities.canCreateDossier
      ? demandes.filter(
          (item) => item.statut === "VALIDEE_DRH" && item.dossierMedical == null
        )
      : [];

    return NextResponse.json(
      {
        status: 200,
        data: {
          connectedAgent,
          stats,
          permissions: capabilities,
          demandes,
          demandesEnAttenteValidation,
          demandesValideesSansDossier,
          dossiersRecents,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/polyclinique/dashboard failed:", error);
    return NextResponse.json(
      { status: 500, message: "Erreur lors du chargement du dashboard polyclinique." },
      { status: 500 }
    );
  }
}
