import prisma from "@/lib/prisma";
import type { SessionUser } from "@/security/auth";
import { isAdmin, isChefService, isRh } from "@/security/roles";

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
  if (!isChefService(user)) return [];

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
  if (isAdmin(user) || isRh(user)) return true;

  const currentAgentId = await getCurrentAgentId(user);
  if (currentAgentId === agentId) return true;

  if (isChefService(user)) {
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

