import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "./auth";
import { canonicalizePermissionCode } from "./permission-aliases";
import { canManageAccessControl } from "./permissions";

function normalizePermissionCode(value: string) {
  return canonicalizePermissionCode(value);
}

export async function getUserPermissionCodes(utilisateurId: number) {
  const user = await prisma.utilisateur.findUnique({
    where: { id: utilisateurId },
    select: {
      roles: {
        select: {
          role: {
            select: {
              actif: true,
              rolePermission: {
                select: {
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

  const codes = new Set<string>();

  for (const roleRelation of user?.roles ?? []) {
    if (!roleRelation.role?.actif) {
      continue;
    }

    for (const grant of roleRelation.role.rolePermission ?? []) {
      const code = grant.permission?.code;
      if (code?.trim()) {
        codes.add(normalizePermissionCode(code));
      }
    }
  }

  return [...codes];
}

export async function requirePermission(permissionCodes: string | string[]) {
  const auth = await getAuthenticatedUser();
  if (!auth) throw new Error("Non authentifie");

  const expected = Array.isArray(permissionCodes)
    ? permissionCodes.map(normalizePermissionCode)
    : [normalizePermissionCode(permissionCodes)];

  const userCodes = await getUserPermissionCodes(auth.userId);
  const ok = expected.some((code) => userCodes.includes(code));

  if (!ok) {
    throw new Error("Acces interdit");
  }

  return auth;
}

export async function requireAccess(options: {
  roles?: string[];
  permissions?: string[];
}) {
  const auth = await getAuthenticatedUser();
  if (!auth) throw new Error("Non authentifie");

  const permissionCodes = (options.permissions ?? []).map(normalizePermissionCode);
  if (!permissionCodes.length) {
    throw new Error("Acces interdit");
  }

  const userCodes = await getUserPermissionCodes(auth.userId);
  const permissionMatch = permissionCodes.some((code) => userCodes.includes(code));

  if (!permissionMatch) {
    throw new Error("Acces interdit");
  }

  return auth;
}

export async function requireAccessControlAccess(permissionCodes: string | string[]) {
  const auth = await getAuthenticatedUser();
  if (!auth) throw new Error("Non authentifie");

  if (canManageAccessControl(auth)) {
    return auth;
  }

  const expected = Array.isArray(permissionCodes)
    ? permissionCodes.map(normalizePermissionCode)
    : [normalizePermissionCode(permissionCodes)];

  const userCodes = await getUserPermissionCodes(auth.userId);
  const ok = expected.some((code) => userCodes.includes(code));

  if (!ok) {
    throw new Error("Acces interdit");
  }

  return auth;
}
