const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient();

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
];

const ADMIN_ROLE_ALIASES = new Set([
  "admin",
  "admingen",
  "admin_gen",
  "admingeneral",
  "administrateur",
  "superadmin",
  "super_admin",
]);

function normalizeToken(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function normalizePermissionCode(value) {
  return String(value ?? "").trim().toLowerCase();
}

function buildPermissionData(code) {
  const [resource, action] = code.split(".");

  const resourceLabel = {
    role: "roles",
    permission: "permissions",
    regle_portee_role: "regles de portee",
  }[resource] ?? resource;

  const actionLabel = {
    read: "Lire",
    create: "Creer",
    update: "Modifier",
    delete: "Supprimer",
  }[action] ?? action;

  return {
    code,
    libelle: `${actionLabel} ${resourceLabel}`,
    description: `${actionLabel} ${resourceLabel}`,
    module: "Roles & Permissions",
    actif: true,
  };
}

function isAdminFamilyRole(role) {
  const candidates = [role.nom, role.key, role.code]
    .map((value) => normalizeToken(value))
    .filter(Boolean);

  return candidates.some((candidate) => ADMIN_ROLE_ALIASES.has(candidate));
}

async function ensureAccessControlPermissions() {
  const existing = await prisma.permisions.findMany({
    where: { code: { in: ACCESS_CONTROL_PERMISSION_CODES } },
    select: { code: true },
  });

  const existingCodes = new Set(
    existing.map((item) => normalizePermissionCode(item.code))
  );

  const missingCodes = ACCESS_CONTROL_PERMISSION_CODES.filter(
    (code) => !existingCodes.has(code)
  );
  //gioto

  for (const code of missingCodes) {
    const data = buildPermissionData(code);
    await prisma.permisions.upsert({
      where: { code },
      update: data,
      create: data,
    });
  }

  return missingCodes.length;
}

async function main() {
  const createdPermissionCount = await ensureAccessControlPermissions();

  const [roles, permissions] = await Promise.all([
    prisma.role.findMany({
      select: {
        id: true,
        nom: true,
        key: true,
        code: true,
        actif: true,
      },
      orderBy: { id: "asc" },
    }),
    prisma.permisions.findMany({
      where: { code: { in: ACCESS_CONTROL_PERMISSION_CODES } },
      select: { id: true, code: true },
    }),
  ]);

  const targetedRoles = roles.filter(isAdminFamilyRole);
  if (!targetedRoles.length) {
    console.log(
      JSON.stringify(
        {
          status: "no-target-role",
          message:
            "Aucun role admin/admin gen detecte. Creez d'abord ces roles puis relancez ce seed.",
          createdPermissionCount,
        },
        null,
        2
      )
    );
    return;
  }

  const permissionIdByCode = new Map(
    permissions.map((permission) => [normalizePermissionCode(permission.code), permission.id])
  );

  let rolePermissionUpserts = 0;
  let scopeRuleUpserts = 0;

  await prisma.$transaction(async (tx) => {
    for (const role of targetedRoles) {
      for (const code of ACCESS_CONTROL_PERMISSION_CODES) {
        const permissionId = permissionIdByCode.get(normalizePermissionCode(code));
        if (!permissionId) {
          continue;
        }

        await tx.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId,
          },
        });
        rolePermissionUpserts += 1;

        await tx.reglePorteeRole.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId,
            },
          },
          update: {
            portee: "TOUTE_ORGANISATION",
          },
          create: {
            roleId: role.id,
            permissionId,
            portee: "TOUTE_ORGANISATION",
          },
        });
        scopeRuleUpserts += 1;
      }
    }
  });

  const verification = await prisma.role.findMany({
    where: { id: { in: targetedRoles.map((role) => role.id) } },
    select: {
      id: true,
      nom: true,
      key: true,
      code: true,
      actif: true,
      _count: {
        select: {
          rolePermission: true,
          reglesPortee: true,
        },
      },
    },
    orderBy: { id: "asc" },
  });

  console.log(
    JSON.stringify(
      {
        status: "ok",
        createdPermissionCount,
        targetedRoles: targetedRoles.map((role) => ({
          id: role.id,
          nom: role.nom,
          key: role.key,
          code: role.code,
          actif: role.actif,
        })),
        rolePermissionUpserts,
        scopeRuleUpserts,
        verification,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("seed-admin-access-control failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

