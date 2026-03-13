import type { SessionRole, SessionUser } from "@/security/auth";

export const ROLE_KEYS = {
  ADMIN: "admin",
  RH: "rh",
  CHEF_SERVICE: "chefservice",
  AGENT: "agent",
} as const;

type RoleKey = (typeof ROLE_KEYS)[keyof typeof ROLE_KEYS];

function normalizeKey(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function isRoleActive(role: SessionRole) {
  const relationActive = role.actif ?? true;
  const roleActive = role.role?.actif ?? true;
  return relationActive && roleActive;
}

export function getRoleKeys(user: SessionUser | null | undefined): string[] {
  if (!user?.role || !Array.isArray(user.role)) return [];

  return user.role
    .filter(isRoleActive)
    .map((item) => normalizeKey(item.role?.key))
    .filter(Boolean);
}

export function getRoleIds(user: SessionUser | null | undefined): number[] {
  if (!user?.role || !Array.isArray(user.role)) return [];

  return user.role
    .filter(isRoleActive)
    .map((item) => Number(item.role?.id ?? item.roleId))
    .filter((id) => Number.isFinite(id));
}

export function hasRole(user: SessionUser | null | undefined, key: RoleKey) {
  const wanted = normalizeKey(key);
  return getRoleKeys(user).includes(wanted);
}

export function isAdmin(user: SessionUser | null | undefined) {
  return hasRole(user, ROLE_KEYS.ADMIN) || getRoleIds(user).includes(1);
}

export function isRh(user: SessionUser | null | undefined) {
  return hasRole(user, ROLE_KEYS.RH) || getRoleIds(user).includes(3);
}

export function isChefService(user: SessionUser | null | undefined) {
  return hasRole(user, ROLE_KEYS.CHEF_SERVICE) || getRoleIds(user).includes(2);
}

export function isAgent(user: SessionUser | null | undefined) {
  return hasRole(user, ROLE_KEYS.AGENT) || getRoleIds(user).includes(4);
}

export function hasAnyRole(
  user: SessionUser | null | undefined,
  keys: readonly RoleKey[]
) {
  const keySet = new Set(getRoleKeys(user));
  return keys.some((key) => keySet.has(normalizeKey(key)));
}
