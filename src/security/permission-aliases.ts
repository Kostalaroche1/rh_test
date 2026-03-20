const LEAVE_PERMISSION_ACTIONS = new Set([
  "read",
  "create",
  "update",
  "delete",
  "request",
  "confirm",
  "validate",
]);

function normalize(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function parsePermission(code: string) {
  const normalized = normalize(code);
  const [resource, action] = normalized.split(".");
  return {
    normalized,
    resource,
    action,
  };
}

export function canonicalizePermissionCode(code: string) {
  const { normalized, resource, action } = parsePermission(code);

  if (
    (resource === "conge" || resource === "demande_conge") &&
    LEAVE_PERMISSION_ACTIONS.has(action)
  ) {
    return `demande_conge.${action}`;
  }

  return normalized;
}

export function expandPermissionCodeAliases(code: string) {
  const canonical = canonicalizePermissionCode(code);
  const { resource, action } = parsePermission(canonical);

  if (resource === "demande_conge" && LEAVE_PERMISSION_ACTIONS.has(action)) {
    return [canonical, `conge.${action}`];
  }

  return [canonical];
}

export function expandPermissionCodeAliasesList(codes: readonly string[]) {
  return [...new Set(codes.flatMap((code) => expandPermissionCodeAliases(code)))];
}
