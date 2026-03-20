import prisma from "@/lib/prisma";
import {
  canonicalizePermissionCode,
  expandPermissionCodeAliasesList,
} from "@/security/permission-aliases";

function normalizePermissionCode(value: string) {
  return canonicalizePermissionCode(value);
}

function startOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

async function getScopedPorteeForPermissions(
  utilisateurId: number,
  permissionCodes: string[]
) {
  // Resolve only the scopes attached to permissions the user really has through active roles.
  const normalizedCodes = [...new Set(permissionCodes.map(normalizePermissionCode))];
  const expandedCodes = expandPermissionCodeAliasesList(normalizedCodes);
  const user = await prisma.utilisateur.findUnique({
    where: { id: utilisateurId },
    select: {
      compteAgent: {
        select: {
          agentId: true,
        },
      },
      roles: {
        select: {
          role: {
            select: {
              actif: true,
              rolePermission: {
                where: {
                  permission: {
                    code: { in: expandedCodes },
                  },
                },
                select: {
                  permission: {
                    select: { code: true },
                  },
                },
              },
              reglesPortee: {
                where: {
                  permission: {
                    code: { in: expandedCodes },
                  },
                },
                select: {
                  portee: true,
                  permission: {
                    select: { code: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const ownAgentId = user?.compteAgent?.agentId ?? null;
  const scopeValues = new Set<string>();

  for (const roleRelation of user?.roles ?? []) {
    const role = roleRelation.role;
    if (!role?.actif) {
      continue;
    }

    const grantedCodes = new Set(
      (role.rolePermission ?? [])
        .map((item) => normalizePermissionCode(item.permission?.code ?? ""))
        .filter(Boolean)
    );

    if (!normalizedCodes.some((code) => grantedCodes.has(code))) {
      continue;
    }

    for (const regle of role.reglesPortee ?? []) {
      const code = normalizePermissionCode(regle.permission?.code ?? "");
      if (normalizedCodes.includes(code)) {
        scopeValues.add(regle.portee);
      }
    }
  }

  return {
    ownAgentId,
    scopes: [...scopeValues],
  };
}

async function getPrimaryUnitIdForAgent(agentId: number | null) {
  if (!agentId) {
    return null;
  }

  const today = startOfToday();
  const affectation = await prisma.affectation.findFirst({
    where: {
      agentId,
      actif: true,
      dateDebut: { lte: today },
      OR: [{ dateFin: null }, { dateFin: { gte: today } }],
    },
    orderBy: [{ principale: "desc" }, { dateDebut: "desc" }],
    select: {
      uniteOrganisationnelleId: true,
    },
  });

  return affectation?.uniteOrganisationnelleId ?? null;
}

async function getDescendantUnitIds(unitId: number) {
  const unit = await prisma.uniteOrganisationnelle.findUnique({
    where: { id: unitId },
    select: { chemin: true },
  });

  if (!unit?.chemin) {
    return [unitId];
  }

  const descendants = await prisma.uniteOrganisationnelle.findMany({
    where: {
      chemin: {
        startsWith: unit.chemin,
      },
    },
    select: { id: true },
  });

  return descendants.map((item) => item.id);
}

export async function getScopedUnitIdsForPermissions(
  utilisateurId: number,
  permissionCodes: string[]
) {
  const { ownAgentId, scopes } = await getScopedPorteeForPermissions(
    utilisateurId,
    permissionCodes
  );

  if (scopes.includes("TOUTE_ORGANISATION")) {
    return null;
  }

  const ownUnitId = await getPrimaryUnitIdForAgent(ownAgentId);
  if (!ownUnitId) {
    return [];
  }

  // Descendant scope is resolved from the current primary assignment in the organisation tree.
  if (scopes.includes("UNITE_ET_DESCENDANTS")) {
    return getDescendantUnitIds(ownUnitId);
  }

  if (scopes.includes("UNITE")) {
    return [ownUnitId];
  }

  return [];
}

export async function canAccessUnitForPermissions(
  utilisateurId: number,
  uniteOrganisationnelleId: number,
  permissionCodes: string[]
) {
  const unitIds = await getScopedUnitIdsForPermissions(utilisateurId, permissionCodes);

  if (unitIds === null) {
    return true;
  }

  return unitIds.includes(uniteOrganisationnelleId);
}

export async function getAccessibleAgentIdsForPermissions(
  utilisateurId: number,
  permissionCodes: string[]
) {
  const { ownAgentId, scopes } = await getScopedPorteeForPermissions(
    utilisateurId,
    permissionCodes
  );

  if (scopes.includes("TOUTE_ORGANISATION")) {
    return null;
  }

  const agentIds = new Set<number>();

  if (scopes.includes("SOI_MEME") && ownAgentId) {
    agentIds.add(ownAgentId);
  }

  // Unit scopes are expanded through current active affectations so list endpoints can filter by agentId only.
  if (scopes.includes("UNITE") || scopes.includes("UNITE_ET_DESCENDANTS")) {
    const ownUnitId = await getPrimaryUnitIdForAgent(ownAgentId);

    if (ownUnitId) {
      const unitIds = scopes.includes("UNITE_ET_DESCENDANTS")
        ? await getDescendantUnitIds(ownUnitId)
        : [ownUnitId];

      const today = startOfToday();
      const scopedAffectations = await prisma.affectation.findMany({
        where: {
          actif: true,
          uniteOrganisationnelleId: { in: unitIds },
          dateDebut: { lte: today },
          OR: [{ dateFin: null }, { dateFin: { gte: today } }],
        },
        select: { agentId: true },
        distinct: ["agentId"],
      });

      for (const item of scopedAffectations) {
        agentIds.add(item.agentId);
      }
    }
  }

  return [...agentIds];
}

export async function canAccessAgentForPermissions(
  utilisateurId: number,
  agentId: number,
  permissionCodes: string[]
) {
  const accessibleAgentIds = await getAccessibleAgentIdsForPermissions(
    utilisateurId,
    permissionCodes
  );

  if (accessibleAgentIds === null) {
    return true;
  }

  return accessibleAgentIds.includes(agentId);
}

export async function getAccessibleOrganisationIdsForPermissions(
  utilisateurId: number,
  permissionCodes: string[],
  resource: "poste" | "fonction"
): Promise<number[] | null> {
  const unitIds = await getScopedUnitIdsForPermissions(utilisateurId, permissionCodes);

  if (unitIds === null) {
    return null;
  }

  if (!unitIds.length) {
    return [];
  }

  if (resource === "poste") {
    const postes: Array<{ id: number }> = await prisma.poste.findMany({
      where: {
        uniteOrganisationnelleId: { in: unitIds },
      },
      select: { id: true },
    });

    return postes.map((item) => item.id);
  }

  if (resource === "fonction") {
    const postes = await getAccessibleOrganisationIdsForPermissions(
      utilisateurId,
      permissionCodes,
      "poste"
    );

    if (postes === null) {
      return null;
    }

    if (!postes.length) {
      return [];
    }

    const fonctions: Array<{ id: number }> = await prisma.fonction.findMany({
      where: { posteId: { in: postes } },
      select: { id: true },
    });

    return fonctions.map((item: { id: number }) => item.id);
  }

  return [];
}

export async function canAccessOrganisationEntityForPermissions(
  utilisateurId: number,
  entityId: number,
  permissionCodes: string[],
  resource: "poste" | "fonction"
) {
  const accessibleIds = await getAccessibleOrganisationIdsForPermissions(
    utilisateurId,
    permissionCodes,
    resource
  );

  if (accessibleIds === null) {
    return true;
  }

  return accessibleIds.includes(entityId);
}
