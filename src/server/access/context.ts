import prisma from "@/lib/prisma";
import type { SessionUser } from "@/security/auth";
import { hasAnyPermission } from "@/security/permissions";
import { getAccessibleAgentIdsForPermissions, getScopedUnitIdsForPermissions } from "@/server/access/scope";

export async function getCurrentCompteAgent(user: SessionUser) {
  return prisma.compteAgent.findUnique({
    where: { utilisateurId: user.userId },
    select: { id: true, agentId: true },
  });
}

export async function getCurrentAgentId(user: SessionUser) {
  const compte = await getCurrentCompteAgent(user);
  return compte?.agentId ?? null;
}

export async function getChefDepartementIds(user: SessionUser) {
  const canManageScopedTeam =
    hasAnyPermission(user, [
      "affectation.read",
      "presence.confirm",
      "demande_conge.confirm",
      "horaire_agent.assign",
    ]);

  if (!canManageScopedTeam) return [];

  const unitIds = await getScopedUnitIdsForPermissions(user.userId, [
    "affectation.read",
    "presence.confirm",
    "demande_conge.confirm",
    "horaire_agent.assign",
  ]);

  if (unitIds === null) return [];
  return unitIds;
}

export async function canAccessAgent(user: SessionUser, agentId: number) {
  const currentAgentId = await getCurrentAgentId(user);
  if (currentAgentId === agentId) return true;

  const accessibleAgentIds = await getAccessibleAgentIdsForPermissions(user.userId, [
    "agent.read",
    "agent_dossier.read",
    "user.read",
    "affectation.read",
    "presence.confirm",
    "demande_conge.confirm",
    "horaire_agent.assign",
  ]);

  if (accessibleAgentIds === null) return true;
  return accessibleAgentIds.includes(agentId);
}
