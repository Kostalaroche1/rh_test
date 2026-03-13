import prisma from "@/lib/prisma";
import type { SessionUser } from "@/security/auth";
import { hasAnyPermission } from "@/security/permissions";

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
      "conge.confirm",
      "horaire_agent.assign",
    ]);

  if (!canManageScopedTeam) return [];

  const agentId = await getCurrentAgentId(user);
  if (!agentId) return [];

  const now = new Date();
  const affectations = await prisma.affectation.findMany({
    where: {
      agentId,
      OR: [{ dateFin: null }, { dateFin: { gte: now } }],
    },
    select: { departementId: true },
  });

  return [...new Set(affectations.map((item) => item.departementId))];
}

export async function canAccessAgent(user: SessionUser, agentId: number) {
  if (
    hasAnyPermission(user, ["agent.read", "user.read", "affectation.read"])
  ) {
    return true;
  }

  const currentAgentId = await getCurrentAgentId(user);
  if (currentAgentId === agentId) return true;

  if (
    hasAnyPermission(user, [
      "presence.confirm",
      "conge.confirm",
      "horaire_agent.assign",
      "affectation.read",
    ])
  ) {
    const departementIds = await getChefDepartementIds(user);
    if (!departementIds.length) return false;

    const matching = await prisma.affectation.findFirst({
      where: {
        agentId,
        departementId: { in: departementIds },
        OR: [{ dateFin: null }, { dateFin: { gte: new Date() } }],
      },
      select: { id: true },
    });

    return Boolean(matching);
  }

  return false;
}
