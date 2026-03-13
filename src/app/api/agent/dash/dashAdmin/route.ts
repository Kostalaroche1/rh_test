import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import { hasAnyPermission } from "@/security/permissions";
import { AgentWithDetails } from "@/utilities/type";
import { NextResponse } from "next/server";
import { getChefDepartementIds } from "@/server/access/context";
import { emitAffectationExpiryAlerts } from "@/server/services/affectation-alert.service";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    try {
      await requireAccess({
        permissions: ["agent.read", "presence.read", "conge.read", "affectation.read"],
      });
    } catch {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const chefDepartements = await getChefDepartementIds(user);
    const scoped =
      chefDepartements.length > 0
        ? {
            affectations: {
              some: {
                departementId: { in: chefDepartements },
                OR: [{ dateFin: null }, { dateFin: { gte: new Date() } }],
              },
            },
          }
        : {};

    if (hasAnyPermission(user, ["affectation.read", "user.read", "agent.read"])) {
      await emitAffectationExpiryAlerts(7);
    }

    const [agentsActif, absences, presences, conges, demandeconges, congesAttente, congesConfirme, congesRejete] =
      await Promise.all([
        prisma.agent.count({ where: { actif: true, ...(scoped as object) } }),
        prisma.presence.count({
          where: {
            statut: "ABSENT",
            ...(chefDepartements.length ? { agent: scoped } : {}),
          },
        }),
        prisma.presence.count({
          where: {
            heureArrivee: { not: null },
            statut: { notIn: ["ABSENT"] },
            ...(chefDepartements.length ? { agent: scoped } : {}),
          },
        }),
        prisma.demandeConge.findMany({
          where: {
            statut: "VALIDE",
            ...(chefDepartements.length ? { agent: scoped } : {}),
          },
        }),
        prisma.demandeConge.count({
          where: chefDepartements.length ? { agent: scoped } : {},
        }),
        prisma.demandeConge.count({
          where: {
            statut: "EN_ATTENTE",
            ...(chefDepartements.length ? { agent: scoped } : {}),
          },
        }),
        prisma.demandeConge.count({
          where: {
            statut: "CONFIRME",
            ...(chefDepartements.length ? { agent: scoped } : {}),
          },
        }),
        prisma.demandeConge.count({
          where: {
            statut: "REJETE",
            ...(chefDepartements.length ? { agent: scoped } : {}),
          },
        }),
      ]);

    const [sites, directions, departements, fonctions, postes, affectations] = await Promise.all([
      prisma.site.count(),
      prisma.direction.count(),
      prisma.departement.count(),
      prisma.fonction.count(),
      prisma.poste.count(),
      prisma.affectation.count(),
    ]);

    let totalJoursConge = 0;
    for (const item of conges) {
      if (item.dateDebut && item.dateFin) {
        const diff = item.dateFin.getTime() - item.dateDebut.getTime();
        totalJoursConge += diff / (1000 * 60 * 60 * 24) + 1;
      }
    }

    const AgentsServicesPresences: AgentWithDetails[] = await prisma.agent.findMany({
      where: chefDepartements.length ? (scoped as object) : undefined,
      select: {
        id: true,
        matricule: true,
        genre: true,
        prenom: true,
        nom: true,
        statut: true,
        affectations: {
          select: {
            departement: { select: { id: true, nom: true } },
            direction: { select: { id: true, libelle: true } },
            grade: { select: { id: true, libelle: true } },
            fonction: {
              select: {
                id: true,
                libelle: true,
                poste: { select: { id: true, libelle: true } },
              },
            },
          },
        },
        presences: {
          select: {
            heureDepart: true,
            statut: true,
            heureArrivee: true,
            date: true,
            validePar: {
              select: {
                compteAgent: {
                  select: { agent: { select: { id: true, nom: true } } },
                },
              },
            },
            confirmePar: {
              select: {
                compteAgent: {
                  select: { agent: { select: { id: true, nom: true } } },
                },
              },
            },
          },
        },
        actif: true,
        demandeConge: {
          select: { id: true, statut: true },
        },
      },
    });

    const congesStatut: CongeStatut = {
      valide: conges.length,
      enattente: congesAttente,
      confirm: congesConfirme,
      rejete: congesRejete,
    };

    const organisation: OrganisationStat = {
      affectation: affectations,
      direction: directions,
      departement: departements,
      fonctions,
      postes,
      sites,
    };

    return NextResponse.json(
      {
        data: {
          absences,
          presences,
          conges: totalJoursConge,
          demandeconges,
          actif: agentsActif,
          enconges: conges.length,
          AgentsPresences: AgentsServicesPresences,
          congesStatut,
          organisation,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Impossible de recuperer les stats" }, { status: 500 });
  }
}

export type CongeStatut = {
  valide: number;
  enattente: number;
  confirm: number;
  rejete: number;
};

export type OrganisationStat = {
  sites: number;
  departement: number;
  direction: number;
  affectation: number;
  postes: number;
  fonctions: number;
};

