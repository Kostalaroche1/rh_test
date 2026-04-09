const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient();

const SCOPE = {
  SELF: "SOI_MEME",
  UNIT: "UNITE",
  UNIT_TREE: "UNITE_ET_DESCENDANTS",
  PROVINCE: "PROVINCE",
  ORG: "TOUTE_ORGANISATION",
};

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
  "agent_dossier.read",
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
];

const AGENT_PERMISSION_CODES = [
  "presence.sign",
  "presence.read",
  "demande_conge.request",
  "demande_conge.read",
  "type_conge.read",
  "paie.read",
  "notification.read",
  "rapport.read",
];

const CHEF_SERVICE_PERMISSION_CODES = [
  "province.read",
  "agent.read",
  "agent_dossier.read",
  "user.read",
  "presence.sign",
  "presence.read",
  "presence.confirm",
  "demande_conge.request",
  "demande_conge.read",
  "demande_conge.confirm",
  "type_conge.read",
  "affectation.read",
  "horaire_travail.read",
  "horaire_agent.read",
  "horaire_agent.assign",
  "notification.read",
  "rapport.read",
];

const RH_PERMISSION_CODES = [
  "province.read",
  "user.read",
  "user.create",
  "user.update",
  "agent.read",
  "agent_dossier.read",
  "agent.create",
  "agent.update",
  "type_conge.read",
  "type_conge.create",
  "type_conge.update",
  "demande_conge.read",
  "demande_conge.request",
  "demande_conge.confirm",
  "demande_conge.validate",
  "demande_conge.update",
  "presence.read",
  "presence.sign",
  "presence.confirm",
  "presence.validate",
  "presence.update",
  "paie.read",
  "paie.create",
  "paie.update",
  "paie.publish",
  "horaire_travail.read",
  "horaire_travail.create",
  "horaire_travail.update",
  "horaire_travail.delete",
  "horaire_agent.read",
  "horaire_agent.assign",
  "horaire_agent.update",
  "horaire_agent.delete",
  "type_unite_organisationnelle.read",
  "type_unite_organisationnelle.create",
  "type_unite_organisationnelle.update",
  "unite_organisationnelle.read",
  "unite_organisationnelle.create",
  "unite_organisationnelle.update",
  "poste.read",
  "poste.create",
  "poste.update",
  "fonction.read",
  "fonction.create",
  "fonction.update",
  "grade.read",
  "grade.create",
  "grade.update",
  "affectation.read",
  "affectation.assign",
  "affectation.update",
  "notification.read",
  "notification.create",
  "notification.update",
  "rapport.read",
  "rapport.create",
  "rapport.update",
  "role.read",
  "role.update",
];

const ROLE_TEMPLATES = [
  {
    id: "admin",
    aliases: [
      "admin",
      "admingen",
      "admin_general",
      "admin_gen",
      "administrateur",
      "superadmin",
      "super_admin",
    ],
    permissionCodes: "*",
    defaultScope: SCOPE.ORG,
  },
  {
    id: "rh",
    aliases: ["rh", "gestionnairerh", "humanresources", "hr"],
    permissionCodes: RH_PERMISSION_CODES,
    defaultScope: SCOPE.ORG,
  },
  {
    id: "chefservice",
    aliases: [
      "chefservice",
      "chef_service",
      "chefdeservice",
      "chefequipe",
      "chef_equipe",
      "responsableunite",
      "manager",
    ],
    permissionCodes: CHEF_SERVICE_PERMISSION_CODES,
    defaultScope: SCOPE.UNIT_TREE,
    scopeOverrides: {
      "presence.sign": SCOPE.SELF,
      "demande_conge.request": SCOPE.SELF,
      "notification.read": SCOPE.SELF,
      "rapport.read": SCOPE.SELF,
    },
  },
  {
    id: "agent",
    aliases: ["agent", "ag", "employe", "employee", "utilisateur"],
    permissionCodes: AGENT_PERMISSION_CODES,
    defaultScope: SCOPE.SELF,
  },
];

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

function sanitizeRoleCode(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function resolveTemplate(role) {
  const candidates = [role.code, role.key, role.nom]
    .map((value) => normalizeToken(value))
    .filter(Boolean);

  for (const template of ROLE_TEMPLATES) {
    for (const alias of template.aliases) {
      const normalizedAlias = normalizeToken(alias);
      if (candidates.some((candidate) => candidate === normalizedAlias)) {
        return template;
      }
    }
  }

  return null;
}

function prepareMissingRoleCodes(roles) {
  const used = new Set(roles.map((role) => sanitizeRoleCode(role.code)).filter(Boolean));
  const updates = [];

  for (const role of roles) {
    if (sanitizeRoleCode(role.code)) continue;

    const base = sanitizeRoleCode(role.key) || sanitizeRoleCode(role.nom) || `role_${role.id}`;
    let candidate = base;
    let suffix = 1;
    while (used.has(candidate)) {
      candidate = `${base}_${suffix}`;
      suffix += 1;
    }

    used.add(candidate);
    updates.push({ roleId: role.id, code: candidate });
  }

  return updates;
}

async function ensurePermissionCatalog() {
  const existing = await prisma.permisions.findMany({ select: { code: true } });
  const existingCodes = new Set(existing.map((item) => normalizePermissionCode(item.code)));
  const missingCodes = DEFAULT_PERMISSION_CODES.filter((code) => !existingCodes.has(code));

  if (missingCodes.length) {
    await prisma.permisions.createMany({
      data: missingCodes.map((code) => ({ code })),
    });
  }
}

async function main() {
  const overwriteExisting = process.argv.includes("--force");
  const dryRun = process.argv.includes("--dry-run");
  const includeInactive = process.argv.includes("--include-inactive");

  if (!dryRun) {
    await ensurePermissionCatalog();
  }

  const [permissions, roles, beforeCount] = await Promise.all([
    prisma.permisions.findMany({ select: { id: true, code: true }, orderBy: { code: "asc" } }),
    prisma.role.findMany({
      select: {
        id: true,
        nom: true,
        key: true,
        code: true,
        actif: true,
        rolePermission: { select: { permissionId: true } },
      },
      orderBy: { id: "asc" },
    }),
    prisma.rolePermission.count(),
  ]);

  const permissionByCode = new Map(
    permissions.map((permission) => [normalizePermissionCode(permission.code), permission.id])
  );
  const allCodes = permissions.map((permission) => normalizePermissionCode(permission.code));

  const codeUpdates = prepareMissingRoleCodes(roles);
  const pendingCodeMap = new Map(codeUpdates.map((item) => [item.roleId, item.code]));

  const assignments = [];
  const details = [];

  for (const role of roles) {
    const roleCode = pendingCodeMap.get(role.id) || role.code;
    const roleView = { ...role, code: roleCode };

    if (!includeInactive && !roleView.actif) {
      details.push({
        roleId: roleView.id,
        nom: roleView.nom,
        template: null,
        status: "skip",
        reason: "inactive",
      });
      continue;
    }

    const template = resolveTemplate(roleView);
    if (!template) {
      details.push({
        roleId: roleView.id,
        nom: roleView.nom,
        template: null,
        status: "skip",
        reason: "no_template",
      });
      continue;
    }

    if (!overwriteExisting && roleView.rolePermission.length > 0) {
      details.push({
        roleId: roleView.id,
        nom: roleView.nom,
        template: template.id,
        status: "skip",
        reason: "already_configured",
      });
      continue;
    }

    const desiredCodes =
      template.permissionCodes === "*"
        ? allCodes
        : [...new Set(template.permissionCodes.map(normalizePermissionCode))];

    const missingCodes = desiredCodes.filter((code) => !permissionByCode.has(code));
    if (missingCodes.length) {
      throw new Error(
        `Permissions manquantes pour ${roleView.nom}: ${missingCodes.join(", ")}`
      );
    }

    const permissionIds = desiredCodes.map((code) => permissionByCode.get(code));
    assignments.push({
      roleId: roleView.id,
      permissionIds,
      scopes: desiredCodes.map((code, index) => ({
        permissionId: permissionIds[index],
        portee: template.scopeOverrides?.[code] || template.defaultScope,
      })),
      template: template.id,
      nom: roleView.nom,
    });
  }

  if (!dryRun) {
    await prisma.$transaction(async (tx) => {
      for (const update of codeUpdates) {
        await tx.role.update({
          where: { id: update.roleId },
          data: { code: update.code },
        });
      }

      for (const item of assignments) {
        await tx.reglePorteeRole.deleteMany({ where: { roleId: item.roleId } });
        await tx.rolePermission.deleteMany({ where: { roleId: item.roleId } });
        await tx.rolePermission.createMany({
          data: item.permissionIds.map((permissionId) => ({
            roleId: item.roleId,
            permissionId,
          })),
        });
        await tx.reglePorteeRole.createMany({
          data: item.scopes.map((scope) => ({
            roleId: item.roleId,
            permissionId: scope.permissionId,
            portee: scope.portee,
          })),
        });
      }
    });
  }

  const afterCount = dryRun
    ? beforeCount + assignments.reduce((sum, item) => sum + item.permissionIds.length, 0)
    : await prisma.rolePermission.count();

  console.log(
    JSON.stringify(
      {
        mode: dryRun ? "dry-run" : "apply",
        overwriteExisting,
        includeInactive,
        roleCodesUpdated: codeUpdates.length,
        rolesUpdated: assignments.length,
        rolePermissionBefore: beforeCount,
        rolePermissionAfter: afterCount,
        roles: assignments.map((item) => ({
          roleId: item.roleId,
          nom: item.nom,
          template: item.template,
          permissions: item.permissionIds.length,
        })),
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("Bootstrap role permissions failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
