const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient();

const CRUD_ACTIONS = ["read", "create", "update", "delete"];

const CRUD_RESOURCES = [
  "role",
  "permission",
  "user",
  "agent",
  "province",
  "type_conge",
  "paie",
  "horaire_travail",
  "poste",
  "fonction",
  "grade",
  "notification",
  "rapport",
  "type_unite_organisationnelle",
  "unite_organisationnelle",
  "regle_portee_role",
];

const EXTRA_PERMISSIONS = [
  "presence.read",
  "presence.update",
  "presence.delete",
  "presence.sign",
  "presence.confirm",
  "presence.validate",
  "demande_conge.read",
  "demande_conge.update",
  "demande_conge.delete",
  "demande_conge.confirm",
  "demande_conge.validate",
  "demande_conge.request",
  "paie.publish",
  "affectation.assign",
  "horaire_agent.assign",
];

const LEGACY_PERMISSION_PREFIXES = ["direction.", "departement.", "site."];

const RESOURCE_LABELS = {
  role: "roles",
  permission: "permissions",
  user: "utilisateurs",
  agent: "agents",
  province: "provinces",
  presence: "presences",
  demande_conge: "demandes de conge",
  type_conge: "types de conge",
  paie: "paies",
  horaire_travail: "horaires de travail",
  horaire_agent: "horaires des agents",
  affectation: "affectations",
  poste: "postes",
  fonction: "fonctions",
  grade: "grades",
  notification: "notifications",
  rapport: "rapports",
  type_unite_organisationnelle: "types d'unite organisationnelle",
  unite_organisationnelle: "unites organisationnelles",
  regle_portee_role: "regles de portee par role",
};

const MODULE_LABELS = {
  role: "Roles & Permissions",
  permission: "Roles & Permissions",
  regle_portee_role: "Roles & Permissions",
  user: "Utilisateurs",
  agent: "Agents",
  province: "Organisation",
  presence: "Presences",
  demande_conge: "Conges",
  type_conge: "Conges",
  paie: "Paie",
  horaire_travail: "Horaires",
  horaire_agent: "Horaires",
  affectation: "Organisation",
  poste: "Organisation",
  fonction: "Organisation",
  grade: "Organisation",
  type_unite_organisationnelle: "Organisation",
  unite_organisationnelle: "Organisation",
  notification: "Notifications & Rapports",
  rapport: "Notifications & Rapports",
};

const ACTION_LABELS = {
  read: "Lire",
  create: "Creer",
  update: "Modifier",
  delete: "Supprimer",
  sign: "Signer",
  confirm: "Confirmer",
  validate: "Valider",
  request: "Demander",
  publish: "Publier",
  assign: "Attribuer",
};

const DEFAULT_PERMISSION_CODES = [
  ...CRUD_RESOURCES.flatMap((resource) =>
    CRUD_ACTIONS.map((action) => `${resource}.${action}`)
  ),
  "horaire_agent.read",
  "horaire_agent.update",
  "horaire_agent.delete",
  "affectation.read",
  "affectation.update",
  "affectation.delete",
  ...EXTRA_PERMISSIONS,
].sort();

const LEGACY_PERMISSION_CODE_MAPPINGS = [
  ["conge.read", "demande_conge.read"],
  ["conge.create", "demande_conge.create"],
  ["conge.update", "demande_conge.update"],
  ["conge.delete", "demande_conge.delete"],
  ["conge.request", "demande_conge.request"],
  ["conge.confirm", "demande_conge.confirm"],
  ["conge.validate", "demande_conge.validate"],
  ["affectation.create", "affectation.assign"],
  ["horaire_agent.create", "horaire_agent.assign"],
];

const DEPRECATED_WORKFLOW_PERMISSIONS = [
  "presence.create",
  "demande_conge.create",
  "affectation.create",
  "horaire_agent.create",
  "presence.signal_absence",
];

const PROVINCES_RDC = [
  { code: "KIN", nom: "Kinshasa" },
  { code: "KON", nom: "Kongo Central" },
  { code: "KWI", nom: "Kwilu" },
  { code: "KWG", nom: "Kwango" },
  { code: "MAI", nom: "Mai-Ndombe" },
  { code: "KAS", nom: "Kasaï" },
  { code: "KSC", nom: "Kasaï Central" },
  { code: "KSO", nom: "Kasaï Oriental" },
  { code: "LOM", nom: "Lomami" },
  { code: "SAN", nom: "Sankuru" },
  { code: "MAN", nom: "Maniema" },
  { code: "SKD", nom: "Sud-Kivu" },
  { code: "NKV", nom: "Nord-Kivu" },
  { code: "TAN", nom: "Tanganyika" },
  { code: "HTL", nom: "Haut-Lomami" },
  { code: "LUA", nom: "Lualaba" },
  { code: "HTK", nom: "Haut-Katanga" },
  { code: "ITU", nom: "Ituri" },
  { code: "HUE", nom: "Haut-Uele" },
  { code: "TSH", nom: "Tshopo" },
  { code: "BAS", nom: "Bas-Uele" },
  { code: "NOR", nom: "Nord-Ubangi" },
  { code: "SUD", nom: "Sud-Ubangi" },
  { code: "MON", nom: "Mongala" },
  { code: "EQU", nom: "Equateur" },
  { code: "TSU", nom: "Tshuapa" },
];

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function slugify(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function buildPermissionRecord(code) {
  const [resource, action] = String(code).split(".");
  const resourceLabel = RESOURCE_LABELS[resource] ?? resource.replaceAll("_", " ");
  const actionLabel = ACTION_LABELS[action] ?? action;
  const moduleLabel = MODULE_LABELS[resource] ?? "Autres";

  return {
    code,
    libelle: `${actionLabel} ${resourceLabel}`.trim(),
    description: `${actionLabel} ${resourceLabel}`.trim(),
    module: moduleLabel,
    actif: true,
  };
}

async function seedPermissions() {
  for (const code of DEFAULT_PERMISSION_CODES) {
    const data = buildPermissionRecord(code);
    await prisma.permisions.upsert({
      where: { code },
      update: data,
      create: data,
    });
  }
}

async function removeLegacyPermissions() {
  const legacyPermissions = await prisma.permisions.findMany({
    where: {
      OR: LEGACY_PERMISSION_PREFIXES.map((prefix) => ({
        code: { startsWith: prefix },
      })),
    },
    select: { id: true },
  });

  if (!legacyPermissions.length) {
    return 0;
  }

  const ids = legacyPermissions.map((item) => item.id);

  await prisma.reglePorteeRole.deleteMany({
    where: { permissionId: { in: ids } },
  });
  await prisma.rolePermission.deleteMany({
    where: { permissionId: { in: ids } },
  });
  await prisma.permisions.deleteMany({
    where: { id: { in: ids } },
  });

  return ids.length;
}

async function removeDeprecatedWorkflowPermissions() {
  const permissions = await prisma.permisions.findMany({
    where: { code: { in: DEPRECATED_WORKFLOW_PERMISSIONS } },
    select: { id: true },
  });

  if (!permissions.length) {
    return 0;
  }

  const ids = permissions.map((item) => item.id);

  await prisma.reglePorteeRole.deleteMany({
    where: { permissionId: { in: ids } },
  });
  await prisma.rolePermission.deleteMany({
    where: { permissionId: { in: ids } },
  });
  await prisma.permisions.deleteMany({
    where: { id: { in: ids } },
  });

  return ids.length;
}

async function migrateLegacyLeavePermissions() {
  let migrated = 0;

  for (const [legacyCode, nextCode] of LEGACY_PERMISSION_CODE_MAPPINGS) {
    const legacyPermission = await prisma.permisions.findUnique({
      where: { code: legacyCode },
      select: { id: true, code: true },
    });

    if (!legacyPermission) {
      continue;
    }

    const nextPermission = await prisma.permisions.upsert({
      where: { code: nextCode },
      update: buildPermissionRecord(nextCode),
      create: buildPermissionRecord(nextCode),
      select: { id: true, code: true },
    });

    const rolePermissions = await prisma.rolePermission.findMany({
      where: { permissionId: legacyPermission.id },
      select: { roleId: true },
    });

    for (const rolePermission of rolePermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: rolePermission.roleId,
            permissionId: nextPermission.id,
          },
        },
        update: {},
        create: {
          roleId: rolePermission.roleId,
          permissionId: nextPermission.id,
        },
      });
    }

    const scopeRules = await prisma.reglePorteeRole.findMany({
      where: { permissionId: legacyPermission.id },
      select: { roleId: true, portee: true },
    });

    for (const scopeRule of scopeRules) {
      await prisma.reglePorteeRole.upsert({
        where: {
          roleId_permissionId: {
            roleId: scopeRule.roleId,
            permissionId: nextPermission.id,
          },
        },
        update: { portee: scopeRule.portee },
        create: {
          roleId: scopeRule.roleId,
          permissionId: nextPermission.id,
          portee: scopeRule.portee,
        },
      });
    }

    await prisma.reglePorteeRole.deleteMany({
      where: { permissionId: legacyPermission.id },
    });
    await prisma.rolePermission.deleteMany({
      where: { permissionId: legacyPermission.id },
    });
    await prisma.permisions.delete({
      where: { id: legacyPermission.id },
    });

    migrated += 1;
  }

  return migrated;
}

async function ensureRoleCodes() {
  const roles = await prisma.role.findMany({
    select: { id: true, key: true, code: true, nom: true },
  });

  for (const role of roles) {
    if (role.code?.trim()) {
      continue;
    }

    const preferred = role.key?.trim() || slugify(role.nom) || `role_${role.id}`;
    await prisma.role.update({
      where: { id: role.id },
      data: { code: preferred },
    });
  }
}

async function seedProvinces() {
  for (const province of PROVINCES_RDC) {
    await prisma.province.upsert({
      where: { code: province.code },
      update: {
        nom: province.nom,
        actif: true,
      },
      create: {
        code: province.code,
        nom: province.nom,
        actif: true,
      },
    });
  }
}

async function main() {
  await seedPermissions();
  await seedProvinces();
  const migratedLegacyLeavePermissions = await migrateLegacyLeavePermissions();
  const removedLegacyPermissions = await removeLegacyPermissions();
  const removedDeprecatedWorkflowPermissions = await removeDeprecatedWorkflowPermissions();
  await ensureRoleCodes();

  console.log("Seed complete", {
    permissions: DEFAULT_PERMISSION_CODES.length,
    provinces: PROVINCES_RDC.length,
    migratedLegacyLeavePermissions,
    removedLegacyPermissions,
    removedDeprecatedWorkflowPermissions,
  });
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
