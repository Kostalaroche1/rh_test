import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import { hasAnyPermission } from "@/security/permissions";
import {
  getAccessibleAgentIdsForPermissions,
  getAccessibleOrganisationIdsForPermissions,
  getScopedProvinceIdsForPermissions,
  getScopedUnitIdsForPermissions,
} from "@/server/access/scope";
import { emitAffectationExpiryAlerts } from "@/server/services/affectation-alert.service";
import { AgentWithDetails } from "@/utilities/type";

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    try {
      await requireAccess({
        permissions: ["agent.read", "presence.read", "demande_conge.read", "affectation.read"],
      });
    } catch {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const accessibleAgentIds = await getAccessibleAgentIdsForPermissions(user.userId, [
      "agent.read",
      "presence.read",
      "demande_conge.read",
      "affectation.read",
    ]);

    const scopedAgents =
      accessibleAgentIds === null
        ? undefined
        : { id: { in: accessibleAgentIds.length ? accessibleAgentIds : [-1] } };

    const scopedUnitIds = hasAnyPermission(user, ["unite_organisationnelle.read", "affectation.read"])
      ? await getScopedUnitIdsForPermissions(user.userId, ["unite_organisationnelle.read", "affectation.read"])
      : [];
    const scopedProvinceIds = hasAnyPermission(user, [
      "province.read",
      "unite_organisationnelle.read",
      "affectation.read",
    ])
      ? await getScopedProvinceIdsForPermissions(user.userId, [
          "province.read",
          "unite_organisationnelle.read",
          "affectation.read",
        ])
      : [];

    const scopedPosteIds = hasAnyPermission(user, ["poste.read"])
      ? await getAccessibleOrganisationIdsForPermissions(user.userId, ["poste.read"], "poste")
      : [];

    const scopedFonctionIds = hasAnyPermission(user, ["fonction.read"])
      ? await getAccessibleOrganisationIdsForPermissions(user.userId, ["fonction.read"], "fonction")
      : [];

    if (hasAnyPermission(user, ["affectation.read", "user.read", "agent.read"])) {
      await emitAffectationExpiryAlerts(7);
    }

    const [
      agentsActif,
      absences,
      presences,
      congesValides,
      demandeconges,
      congesAttente,
      congesConfirme,
      congesRejete,
    ] = await Promise.all([
      prisma.agent.count({ where: { actif: true, ...(scopedAgents ?? {}) } }),
      prisma.presence.count({
        where: {
          statut: "ABSENT",
          ...(scopedAgents ? { agent: scopedAgents } : {}),
        },
      }),
      prisma.presence.count({
        where: {
          heureArrivee: { not: null },
          statut: { notIn: ["ABSENT"] },
          ...(scopedAgents ? { agent: scopedAgents } : {}),
        },
      }),
      prisma.demandeConge.findMany({
        where: {
          statut: "VALIDE",
          ...(scopedAgents ? { agent: scopedAgents } : {}),
        },
      }),
      prisma.demandeConge.count({
        where: scopedAgents ? { agent: scopedAgents } : {},
      }),
      prisma.demandeConge.count({
        where: {
          statut: "EN_ATTENTE",
          ...(scopedAgents ? { agent: scopedAgents } : {}),
        },
      }),
      prisma.demandeConge.count({
        where: {
          statut: "CONFIRME",
          ...(scopedAgents ? { agent: scopedAgents } : {}),
        },
      }),
      prisma.demandeConge.count({
        where: {
          statut: "REJETE",
          ...(scopedAgents ? { agent: scopedAgents } : {}),
        },
      }),
    ]);

    const [typesOrganisationnels, unites, fonctions, postes, affectations] = await Promise.all([
      hasAnyPermission(user, ["type_unite_organisationnelle.read"])
        ? prisma.typeUniteOrganisationnelle.findMany({
            where:
              scopedProvinceIds === null
                ? undefined
                : {
                    typeOrgaUniteProvinces: {
                      some: {
                        provinceId: {
                          in: scopedProvinceIds.length ? scopedProvinceIds : [-1],
                        },
                        actif: true,
                      },
                    },
                  },
            select: {
              id: true,
              code: true,
              nom: true,
              description: true,
              parentId: true,
              ordre: true,
              actif: true,
              systeme: true,
              parent: {
                select: { id: true, code: true, nom: true, parentId: true },
              },
              enfants: {
                select: { id: true, code: true, nom: true, parentId: true },
                orderBy: [{ ordre: "asc" }, { nom: "asc" }],
              },
              typeOrgaUniteProvinces: {
                where:
                  scopedProvinceIds === null
                    ? undefined
                    : {
                        provinceId: {
                          in: scopedProvinceIds.length ? scopedProvinceIds : [-1],
                        },
                      },
                select: {
                  id: true,
                  provinceId: true,
                  uniteOrganisationnelleId: true,
                  actif: true,
                },
                orderBy: [{ provinceId: "asc" }, { id: "asc" }],
              },
            },
            orderBy: [{ ordre: "asc" }, { nom: "asc" }],
          })
        : Promise.resolve([]),
      hasAnyPermission(user, ["unite_organisationnelle.read", "affectation.read"])
        ? prisma.uniteOrganisationnelle.count({
            where:
              scopedUnitIds === null
                ? undefined
                : { id: { in: scopedUnitIds.length ? scopedUnitIds : [-1] } },
          })
        : Promise.resolve(0),
      hasAnyPermission(user, ["fonction.read"])
        ? prisma.fonction.count({
            where:
              scopedFonctionIds === null
                ? undefined
                : { id: { in: scopedFonctionIds.length ? scopedFonctionIds : [-1] } },
          })
        : Promise.resolve(0),
      hasAnyPermission(user, ["poste.read"])
        ? prisma.poste.count({
            where:
              scopedPosteIds === null
                ? undefined
                : { id: { in: scopedPosteIds.length ? scopedPosteIds : [-1] } },
          })
        : Promise.resolve(0),
      prisma.affectation.count({
        where:
          accessibleAgentIds === null
            ? undefined
            : { agentId: { in: accessibleAgentIds.length ? accessibleAgentIds : [-1] } },
      }),
    ]);

    const typesUnites = typesOrganisationnels.length;

    const organisationParProvince = hasAnyPermission(user, [
      "province.read",
      "unite_organisationnelle.read",
      "affectation.read",
    ])
      ? await (async () => {
          const provinces = await prisma.province.findMany({
            where:
              scopedProvinceIds === null
                ? undefined
                : { id: { in: scopedProvinceIds.length ? scopedProvinceIds : [-1] } },
            select: {
              id: true,
              code: true,
              nom: true,
            },
            orderBy: [{ nom: "asc" }],
          });

          return Promise.all(
            provinces.map(async (province) => {
              const links = await prisma.typeOrgaUniteProvince.findMany({
                where: {
                  provinceId: province.id,
                  uniteOrganisationnelleId: { not: null },
                  ...(scopedUnitIds === null
                    ? {}
                    : {
                        uniteOrganisationnelleId: {
                          in: scopedUnitIds.length ? scopedUnitIds : [-1],
                        },
                      }),
                },
                select: {
                  id: true,
                  typeUniteId: true,
                  typeUnite: {
                    select: {
                      id: true,
                      code: true,
                      nom: true,
                      parentId: true,
                    },
                  },
                  uniteOrganisationnelleId: true,
                  uniteOrganisationnelle: {
                    select: {
                      id: true,
                      code: true,
                      nom: true,
                      parentId: true,
                      niveau: true,
                      _count: {
                        select: { postes: true },
                      },
                    },
                  },
                  _count: {
                    select: { affectations: true },
                  },
                },
                orderBy: [{ uniteOrganisationnelleId: "asc" }],
              });

              const unitMap = new Map<
                number,
                {
                  id: number;
                  code: string;
                  nom: string;
                  parentId: number | null;
                  niveau: number;
                  _count: { postes: number; affectations: number };
                }
              >();

              let affectationsCount = 0;
              for (const link of links) {
                affectationsCount += link._count.affectations;
                const unit = link.uniteOrganisationnelle;
                if (!unit) continue;
                const current = unitMap.get(unit.id);
                if (!current) {
                  unitMap.set(unit.id, {
                    id: unit.id,
                    code: unit.code,
                    nom: unit.nom,
                    parentId: unit.parentId,
                    niveau: unit.niveau,
                    _count: {
                      postes: unit._count.postes,
                      affectations: link._count.affectations,
                    },
                  });
                } else {
                  current._count.affectations += link._count.affectations;
                }
              }

              const unites = [...unitMap.values()].sort((a, b) =>
                a.niveau === b.niveau ? a.nom.localeCompare(b.nom) : a.niveau - b.niveau
              );

              return {
                ...province,
                _count: {
                  unites: unites.length,
                  affectations: affectationsCount,
                },
                unites,
                links: links.map((link) => ({
                  id: link.id,
                  typeUniteId: link.typeUniteId,
                  typeUnite: link.typeUnite,
                  provinceId: province.id,
                  province: {
                    id: province.id,
                    code: province.code,
                    nom: province.nom,
                  },
                  uniteOrganisationnelleId: link.uniteOrganisationnelleId ?? null,
                  uniteOrganisationnelle: link.uniteOrganisationnelle
                    ? {
                        id: link.uniteOrganisationnelle.id,
                        code: link.uniteOrganisationnelle.code,
                        nom: link.uniteOrganisationnelle.nom,
                        parentId: link.uniteOrganisationnelle.parentId,
                        niveau: link.uniteOrganisationnelle.niveau,
                      }
                    : null,
                  _count: {
                    affectations: link._count.affectations,
                  },
                })),
              };
            })
          );
        })()
      : [];

    const organisationMappings = organisationParProvince.flatMap((province: any) => province.links ?? []);

    let totalJoursConge = 0;
    for (const item of congesValides) {
      if (item.dateDebut && item.dateFin) {
        const diff = item.dateFin.getTime() - item.dateDebut.getTime();
        totalJoursConge += diff / (1000 * 60 * 60 * 24) + 1;
      }
    }

    const AgentsServicesPresences: AgentWithDetails[] = await prisma.agent.findMany({
      where: scopedAgents ?? undefined,
      select: {
        id: true,
        matricule: true,
        genre: true,
        prenom: true,
        nom: true,
        statut: true,
        affectations: {
          select: {
            id: true,
            dateDebut: true,
            dateFin: true,
            principale: true,
            actif: true,
            statutOrganisationnel: true,
            typeOrgaUniteProvince: {
              select: {
                typeUnite: { select: { id: true, nom: true, code: true, parentId: true } },
                province: { select: { id: true, nom: true, code: true } },
                uniteOrganisationnelle: {
                  select: { id: true, nom: true, code: true, parentId: true, niveau: true },
                },
              },
            },
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
          select: { id: true, statut: true, dateDemande: true, dateDebut: true, dateFin: true },
        },
      },
    });

    return NextResponse.json(
      {
        data: {
          absences,
          presences,
          conges: totalJoursConge,
          demandeconges,
          actif: agentsActif,
          enconges: congesValides.length,
          AgentsPresences: AgentsServicesPresences,
          congesStatut: {
            valide: congesValides.length,
            enattente: congesAttente,
            confirm: congesConfirme,
            rejete: congesRejete,
          },
          scope: {
            hasGlobalProvinceAccess: scopedProvinceIds === null,
            provinceIds: scopedProvinceIds === null ? null : scopedProvinceIds,
            hasGlobalUnitAccess: scopedUnitIds === null,
            unitIds: scopedUnitIds === null ? null : scopedUnitIds,
          },
          organisation: {
            affectation: affectations,
            typesUnites,
            stations: typesUnites,
            types: typesOrganisationnels,
            unites,
            directions: unites,
            fonctions,
            postes,
            provinces: organisationParProvince,
            mappings: organisationMappings,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Impossible de recuperer les stats" }, { status: 500 });
  }
}
