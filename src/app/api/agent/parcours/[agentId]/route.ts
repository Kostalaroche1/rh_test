import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { canAccessAgent } from "@/server/access/context";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ agentId: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ message: "Non autorise" }, { status: 401 });
    }

    const { agentId: rawAgentId } = await params;
    const agentId = Number(rawAgentId);
    if (!Number.isFinite(agentId)) {
      return NextResponse.json({ message: "Agent invalide" }, { status: 400 });
    }

    const allowed = await canAccessAgent(user, agentId);
    if (!allowed) {
      return NextResponse.json({ message: "Acces refuse" }, { status: 403 });
    }

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        affectations: {
          include: {
            poste: {
              include: {
                uniteOrganisationnelle: true,
              },
            },
            fonction: true,
            grade: true,
            typeOrgaUniteProvince: {
              include: {
                typeUnite: true,
                province: true,
                uniteOrganisationnelle: {
                  include: {
                    parent: true,
                  },
                },
              },
            },
          },
          orderBy: { dateDebut: "desc" },
        },
        historique: {
          orderBy: { date: "desc" },
        },
        demandeConge: {
          include: { typeConge: true },
          orderBy: { dateDemande: "desc" },
        },
        demandesSoin: {
          include: {
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
          orderBy: { dateDemande: "desc" },
        },
        dossiersMedicaux: {
          include: {
            demandeSoin: {
              select: {
                id: true,
                motif: true,
                dateDemande: true,
                statut: true,
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
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        paie: {
          include: { primes: true },
          orderBy: { datePaiement: "desc" },
        },
      },
    });

    if (!agent) {
      return NextResponse.json({ message: "Agent introuvable" }, { status: 404 });
    }

    const timeline = [
      ...agent.affectations.flatMap((a) => [
        // Chronologie principale du parcours d'affectation.
        {
          type: "AFFECTATION_DEBUT",
          date: a.dateDebut,
          label: `Debut d'affectation: ${a.poste?.libelle ?? "-"} / ${a.typeOrgaUniteProvince?.uniteOrganisationnelle?.nom ?? "-"}`,
          payload: a,
        },
        ...(a.dateFin
          ? [
              {
                type: "AFFECTATION_FIN",
                date: a.dateFin,
                label: `Fin d'affectation (${a.poste?.libelle ?? "-"})`,
                payload: a,
              },
            ]
          : []),
      ]),
      ...agent.historique.map((h) => ({
        type: "HISTORIQUE",
        date: h.date,
        label: `${h.champ}: ${h.ancienneValeur ?? "-"} -> ${h.nouvelleValeur ?? "-"}`,
        payload: h,
      })),
      ...agent.demandeConge.map((d) => ({
        type: "CONGE",
        date: d.dateDemande,
        label: `Demande de conge (${d.typeConge?.libelle ?? "-"}) - ${d.statut}`,
        payload: d,
      })),
      ...agent.demandesSoin.map((d) => ({
        type: "DEMANDE_SOIN",
        date: d.dateDemande,
        label: `Demande de soin (${d.motif ?? "-"}) - ${d.statut}`,
        payload: d,
      })),
      ...agent.dossiersMedicaux.map((dossier) => ({
        type: "DOSSIER_MEDICAL",
        date: dossier.createdAt,
        label: `Dossier medical etabli (${dossier.demandeSoin?.motif ?? "Soin"})`,
        payload: dossier,
      })),
      ...agent.paie.map((p) => ({
        type: "PAIE",
        date: p.datePaiement ?? new Date(`${p.periode}-01-01`),
        label: `Paie ${p.periode} - Net ${Number(p.net).toLocaleString("fr-FR")}`,
        payload: p,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(
      {
        data: {
          agent,
          timeline,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/agent/parcours/[agentId] failed:", error);
    return NextResponse.json(
      { message: "Erreur lors du chargement du parcours agent" },
      { status: 500 }
    );
  }
}
