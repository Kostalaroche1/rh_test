import type { SessionUser } from "@/security/auth";
import { hasAnyPermission, hasPermission } from "@/security/permissions";
import { getCurrentAgentId } from "@/server/access/context";
import { getAccessibleAgentIdsForPermissions } from "@/server/access/scope";
import { POLYCLINIQUE_ACCESS_CODES, POLYCLINIQUE_PERMISSION, POLYCLINIQUE_SCOPE_CODES } from "@/polyclinique/permissions";

export function getPolycliniqueCapabilities(user: SessionUser | null) {
  return {
    canAccess: hasAnyPermission(user, POLYCLINIQUE_ACCESS_CODES),
    canRequest: hasPermission(user, POLYCLINIQUE_PERMISSION.DEMANDE_REQUEST),
    canValidate: hasPermission(user, POLYCLINIQUE_PERMISSION.DEMANDE_VALIDATE),
    canCreateDossier: hasPermission(user, POLYCLINIQUE_PERMISSION.DOSSIER_CREATE),
    canReadDossier: hasPermission(user, POLYCLINIQUE_PERMISSION.DOSSIER_READ),
  };
}

export async function getPolycliniqueScopeAgentIds(user: SessionUser) {
  return getAccessibleAgentIdsForPermissions(user.userId, [...POLYCLINIQUE_SCOPE_CODES]);
}

export async function getCurrentSessionAgentId(user: SessionUser) {
  return getCurrentAgentId(user);
}
