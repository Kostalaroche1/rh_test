import type { SessionRole, SessionUser } from "@/security/auth";

function isRoleActive(role: SessionRole) {
  const relationActive = role.actif ?? true;
  const roleActive = role.role?.actif ?? true;
  return relationActive && roleActive;
}

export function getRoleIds(user: SessionUser | null | undefined): number[] {
  if (!user?.role || !Array.isArray(user.role)) return [];

  return user.role
    .filter(isRoleActive)
    .map((item) => Number(item.role?.id ?? item.roleId))
    .filter((id) => Number.isFinite(id));
}
