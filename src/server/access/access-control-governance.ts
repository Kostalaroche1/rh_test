import { PorteeDonnees } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import type { SessionUser } from "@/security/auth";
import { getPermissionCodes, hasPermission } from "@/security/permissions";
import {
  getPermissionScopesForUser,
  getScopedProvinceIdsForPermissions,
} from "@/server/access/scope";

const ACCESS_CONTROL_PERMISSION_CODES = [
  "role.read",
  "role.create",
  "role.update",
  "role.delete",
  "permission.read",
  "permission.create",
  "permission.update",
  "permission.delete",
  "regle_portee_role.read",
  "regle_portee_role.create",
  "regle_portee_role.update",
  "regle_portee_role.delete",
] as const;

const PROVINCE_ROLE_PREFIX = "province__";
const GLOBAL_ROLE_PREFIX = "global__";

export type AccessAdministrationLevel = "NONE" | "PROVINCE" | "GLOBAL";

export type AccessControlGovernanceContext = {
  administrationLevel: AccessAdministrationLevel;
  isGlobalAdministrator: boolean;
  managedProvinceIds: number[];
  managedProvinceId: number | null;
  managedProvinceCode: string | null;
  managedProvinceName: string | null;
  canReadRoles: boolean;
  canCreateRoles: boolean;
  canUpdateRoles: boolean;
  canDeleteRoles: boolean;
  canReadPermissions: boolean;
  canManagePermissionCatalog: boolean;
  maxAssignableScope: PorteeDonnees;
};

export type RoleGovernance = {
  ownership: "GLOBAL" | "PROVINCE";
  provinceCode: string | null;
  provinceName: string | null;
  provinceId: number | null;
  namespaceKey: string;
  displayName: string;
  editableByProvinceAdmin: boolean;
  assignableByProvinceAdmin: boolean;
};

type RoleLike = {
  id: number;
  nom: string;
  key?: string | null;
  code?: string | null;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function extractNamespace(value: string | null | undefined) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized.startsWith(PROVINCE_ROLE_PREFIX)) {
    const parts = normalized.split("__");
    const provinceCode = parts[1]?.trim().toUpperCase() ?? null;
    return provinceCode
      ? { ownership: "PROVINCE" as const, provinceCode, namespaceKey: normalized }
      : null;
  }

  if (normalized.startsWith(GLOBAL_ROLE_PREFIX)) {
    return {
      ownership: "GLOBAL" as const,
      provinceCode: null,
      namespaceKey: normalized,
    };
  }

  return {
    ownership: "GLOBAL" as const,
    provinceCode: null,
    namespaceKey: normalized,
  };
}

export async function getAccessControlGovernanceContext(
  user: SessionUser
): Promise<AccessControlGovernanceContext> {
  const permissionCodes = new Set(getPermissionCodes(user));
  const scopes = await getPermissionScopesForUser(
    user.userId,
    ACCESS_CONTROL_PERMISSION_CODES as unknown as string[]
  );
  const managedProvinceIds =
    (await getScopedProvinceIdsForPermissions(
      user.userId,
      ACCESS_CONTROL_PERMISSION_CODES as unknown as string[]
    )) ?? [];

  const managedProvinceId = managedProvinceIds[0] ?? null;
  const province =
    managedProvinceId != null
      ? await prisma.province.findUnique({
          where: { id: managedProvinceId },
          select: { id: true, code: true, nom: true },
        })
      : null;

  const isGlobalAdministrator = scopes.includes(PorteeDonnees.TOUTE_ORGANISATION);
  const administrationLevel: AccessAdministrationLevel = isGlobalAdministrator
    ? "GLOBAL"
    : managedProvinceIds.length
      ? "PROVINCE"
      : "NONE";

  return {
    administrationLevel,
    isGlobalAdministrator,
    managedProvinceIds,
    managedProvinceId: province?.id ?? null,
    managedProvinceCode: province?.code ?? null,
    managedProvinceName: province?.nom ?? null,
    canReadRoles: permissionCodes.has("role.read"),
    canCreateRoles: permissionCodes.has("role.create"),
    canUpdateRoles: permissionCodes.has("role.update"),
    canDeleteRoles: permissionCodes.has("role.delete"),
    canReadPermissions: permissionCodes.has("permission.read"),
    canManagePermissionCatalog:
      isGlobalAdministrator &&
      (hasPermission(user, "permission.create") || hasPermission(user, "permission.update")),
    maxAssignableScope: isGlobalAdministrator
      ? PorteeDonnees.TOUTE_ORGANISATION
      : managedProvinceIds.length
        ? PorteeDonnees.PROVINCE
        : PorteeDonnees.UNITE_ET_DESCENDANTS,
  };
}

export async function getRoleGovernance(role: RoleLike): Promise<RoleGovernance> {
  const namespace =
    extractNamespace(role.code) ??
    extractNamespace(role.key) ?? {
      ownership: "GLOBAL" as const,
      provinceCode: null,
      namespaceKey: role.code ?? role.key ?? String(role.id),
    };

  if (namespace.ownership === "PROVINCE" && namespace.provinceCode) {
    const province = await prisma.province.findUnique({
      where: { code: namespace.provinceCode },
      select: { id: true, code: true, nom: true },
    });

    return {
      ownership: "PROVINCE",
      provinceCode: province?.code ?? namespace.provinceCode,
      provinceName: province?.nom ?? null,
      provinceId: province?.id ?? null,
      namespaceKey: namespace.namespaceKey,
      displayName: role.nom,
      editableByProvinceAdmin: true,
      assignableByProvinceAdmin: true,
    };
  }

  return {
    ownership: "GLOBAL",
    provinceCode: null,
    provinceName: null,
    provinceId: null,
    namespaceKey: namespace.namespaceKey,
    displayName: role.nom,
    editableByProvinceAdmin: false,
    assignableByProvinceAdmin: true,
  };
}

export async function canManageRoleFromContext(
  context: AccessControlGovernanceContext,
  role: RoleLike
) {
  if (context.isGlobalAdministrator) {
    return true;
  }

  if (context.administrationLevel !== "PROVINCE") {
    return false;
  }

  const governance = await getRoleGovernance(role);
  return (
    governance.ownership === "PROVINCE" &&
    governance.provinceCode != null &&
    governance.provinceCode === context.managedProvinceCode
  );
}

export async function canAssignRoleFromContext(
  context: AccessControlGovernanceContext,
  role: RoleLike
) {
  if (context.isGlobalAdministrator) {
    return true;
  }

  const governance = await getRoleGovernance(role);
  if (governance.ownership === "GLOBAL") {
    return true;
  }

  return canManageRoleFromContext(context, role);
}

export function getAllowedScopesForContext(context: AccessControlGovernanceContext) {
  if (context.isGlobalAdministrator) {
    return [
      PorteeDonnees.SOI_MEME,
      PorteeDonnees.UNITE,
      PorteeDonnees.UNITE_ET_DESCENDANTS,
      PorteeDonnees.PROVINCE,
      PorteeDonnees.TOUTE_ORGANISATION,
    ];
  }

  if (context.administrationLevel === "PROVINCE") {
    return [
      PorteeDonnees.SOI_MEME,
      PorteeDonnees.UNITE,
      PorteeDonnees.UNITE_ET_DESCENDANTS,
      PorteeDonnees.PROVINCE,
    ];
  }

  return [
    PorteeDonnees.SOI_MEME,
    PorteeDonnees.UNITE,
    PorteeDonnees.UNITE_ET_DESCENDANTS,
  ];
}

export function buildRoleNamespacePayload(
  inputName: string,
  context: AccessControlGovernanceContext
) {
  const trimmedName = inputName.trim();
  const slug = slugify(trimmedName || "role");

  if (context.isGlobalAdministrator) {
    return {
      nom: trimmedName,
      key: `${GLOBAL_ROLE_PREFIX}${slug}`,
      code: `${GLOBAL_ROLE_PREFIX}${slug}`.toUpperCase(),
    };
  }

  if (context.administrationLevel === "PROVINCE" && context.managedProvinceCode) {
    const provinceLabel = context.managedProvinceName ?? context.managedProvinceCode;
    return {
      nom: `${trimmedName} (${provinceLabel})`,
      key: `${PROVINCE_ROLE_PREFIX}${context.managedProvinceCode.toLowerCase()}__${slug}`,
      code: `${PROVINCE_ROLE_PREFIX}${context.managedProvinceCode.toLowerCase()}__${slug}`.toUpperCase(),
    };
  }

  return {
    nom: trimmedName,
    key: slug,
    code: slug.toUpperCase(),
  };
}

export async function filterRolesForContext<T extends RoleLike>(
  context: AccessControlGovernanceContext,
  roles: T[]
) {
  if (context.isGlobalAdministrator) {
    return roles;
  }

  const filtered: T[] = [];
  for (const role of roles) {
    const governance = await getRoleGovernance(role);
    if (governance.ownership === "GLOBAL") {
      filtered.push(role);
      continue;
    }

    if (
      governance.ownership === "PROVINCE" &&
      governance.provinceCode === context.managedProvinceCode
    ) {
      filtered.push(role);
    }
  }

  return filtered;
}
