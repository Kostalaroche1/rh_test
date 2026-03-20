import type { SessionUser } from "./auth";
import { canonicalizePermissionCode } from "./permission-aliases";

function normalizePermission(value: string | null | undefined) {
  return canonicalizePermissionCode(value ?? "");
}

export function getPermissionCodes(user: SessionUser | null | undefined) {
  if (!Array.isArray(user?.permissions)) {
    return [];
  }

  return user.permissions.map(normalizePermission).filter(Boolean);
}

export function hasPermission(
  user: SessionUser | null | undefined,
  permission: string
) {
  return getPermissionCodes(user).includes(normalizePermission(permission));
}

export function hasAnyPermission(
  user: SessionUser | null | undefined,
  permissions: readonly string[]
) {
  const codeSet = new Set(getPermissionCodes(user));
  return permissions.some((permission) => codeSet.has(normalizePermission(permission)));
}

export function hasAllPermissions(
  user: SessionUser | null | undefined,
  permissions: readonly string[]
) {
  const codeSet = new Set(getPermissionCodes(user));
  return permissions.every((permission) => codeSet.has(normalizePermission(permission)));
}

export function canManageAccessControl(user: SessionUser | null | undefined) {
  return hasAnyPermission(user, [
    "role.read",
    "role.create",
    "role.update",
    "permission.read",
    "permission.create",
    "permission.update",
  ]);
}
