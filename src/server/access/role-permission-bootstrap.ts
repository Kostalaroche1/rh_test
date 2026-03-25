import { PorteeDonnees } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { DEFAULT_PERMISSION_CODES } from "@/server/access/permission-catalog";

type Scope = PorteeDonnees;

type RoleTemplate = {
  id: "admin" | "rh" | "chefservice" | "agent";
  aliases: string[];
  permissionCodes: string[] | "*";
  defaultScope: Scope;
  scopeOverrides?: Record<string, Scope>;
};

type BootstrapOptions = {
  overwriteExisting?: boolean;
  includeInactiveRoles?: boolean;
  dryRun?: boolean;
};

type BootstrapRoleResult = {
  roleId: number;
  roleName: string;
  roleKey: string | null;
  roleCode: string | null;
  templateId: RoleTemplate["id"] | null;
  status: "updated" | "skipped";
  reason?: string;
  permissionsAssigned: number;
};

export type BootstrapSummary = {
  totalPermissionsInCatalog: number;
  rolePermissionCountBefore: number;
  rolePermissionCountAfter: number;
  roleCodesUpdated: number;
  rolesConsidered: number;
  rolesUpdated: number;
  rolesSkipped: number;
  details: BootstrapRoleResult[];
};

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

const ROLE_TEMPLATES: RoleTemplate[] = [
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
    defaultScope: PorteeDonnees.TOUTE_ORGANISATION,
  },
  {
    id: "rh",
    aliases: ["rh", "gestionnairerh", "humanresources", "hr"],
    permissionCodes: RH_PERMISSION_CODES,
    defaultScope: PorteeDonnees.TOUTE_ORGANISATION,
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
    defaultScope: PorteeDonnees.UNITE_ET_DESCENDANTS,
    scopeOverrides: {
      "presence.sign": PorteeDonnees.SOI_MEME,
      "demande_conge.request": PorteeDonnees.SOI_MEME,
      "notification.read": PorteeDonnees.SOI_MEME,
      "rapport.read": PorteeDonnees.SOI_MEME,
    },
  },
  {
    id: "agent",
    aliases: ["agent", "ag", "employe", "employee", "utilisateur"],
    permissionCodes: AGENT_PERMISSION_CODES,
    defaultScope: PorteeDonnees.SOI_MEME,
  },
];

function normalizeToken(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function normalizePermissionCode(value: string | null | undefined) {
  return String(value ?? "").trim().toLowerCase();
}

function sanitizeRoleCode(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function resolveRoleTemplate(role: { key?: string | null; code?: string | null; nom?: string | null }) {
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

type RoleCodeUpdate = { roleId: number; code: string };

function prepareMissingRoleCodes(
  roles: Array<{ id: number; key: string | null; nom: string; code: string | null }>
) {
  const used = new Set(
    roles.map((role) => sanitizeRoleCode(role.code)).filter(Boolean)
  );

  const updates: RoleCodeUpdate[] = [];

  for (const role of roles) {
    if (sanitizeRoleCode(role.code)) {
      continue;
    }

    const base =
      sanitizeRoleCode(role.key) ||
      sanitizeRoleCode(role.nom) ||
      `role_${role.id}`;

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

function buildRoleWithPendingCode(
  role: {
    id: number;
    nom: string;
    key: string | null;
    code: string | null;
    actif: boolean;
    rolePermission: Array<{ permissionId: number }>;
  },
  pendingCodeMap: Map<number, string>
) {
  return {
    ...role,
    code: pendingCodeMap.get(role.id) ?? role.code,
  };
}

export async function getRolePermissionCount() {
  return prisma.rolePermission.count();
}

export async function applyDefaultRolePermissions(options: BootstrapOptions = {}) {
  const overwriteExisting = options.overwriteExisting ?? false;
  const includeInactiveRoles = options.includeInactiveRoles ?? false;
  const dryRun = options.dryRun ?? false;

  if (!dryRun) {
    const existingPermissions = await prisma.permisions.findMany({
      select: { code: true },
    });
    const existingCodes = new Set(
      existingPermissions.map((item) => normalizePermissionCode(item.code))
    );
    const missingCodes = DEFAULT_PERMISSION_CODES.filter(
      (code) => !existingCodes.has(code)
    );

    if (missingCodes.length) {
      await prisma.permisions.createMany({
        data: missingCodes.map((code) => ({ code })),
      });
    }
  }

  const [permissions, roles, rolePermissionCountBefore] = await Promise.all([
    prisma.permisions.findMany({
      select: { id: true, code: true },
      orderBy: { code: "asc" },
    }),
    prisma.role.findMany({
      select: {
        id: true,
        nom: true,
        key: true,
        code: true,
        actif: true,
        rolePermission: {
          select: { permissionId: true },
        },
      },
      orderBy: { id: "asc" },
    }),
    prisma.rolePermission.count(),
  ]);

  const permissionIdByCode = new Map(
    permissions.map((permission) => [
      normalizePermissionCode(permission.code),
      permission.id,
    ])
  );
  const allPermissionCodes = permissions.map((permission) =>
    normalizePermissionCode(permission.code)
  );

  const roleCodeUpdates = prepareMissingRoleCodes(roles);
  const pendingCodeMap = new Map(roleCodeUpdates.map((item) => [item.roleId, item.code]));

  const assignments: Array<{
    roleId: number;
    permissionIds: number[];
    scopes: Array<{ permissionId: number; portee: Scope }>;
  }> = [];

  const details: BootstrapRoleResult[] = [];

  for (const role of roles) {
    const roleWithCode = buildRoleWithPendingCode(role, pendingCodeMap);

    if (!includeInactiveRoles && !roleWithCode.actif) {
      details.push({
        roleId: roleWithCode.id,
        roleName: roleWithCode.nom,
        roleKey: roleWithCode.key,
        roleCode: roleWithCode.code,
        templateId: null,
        status: "skipped",
        reason: "role_inactif",
        permissionsAssigned: 0,
      });
      continue;
    }

    const template = resolveRoleTemplate(roleWithCode);
    if (!template) {
      details.push({
        roleId: roleWithCode.id,
        roleName: roleWithCode.nom,
        roleKey: roleWithCode.key,
        roleCode: roleWithCode.code,
        templateId: null,
        status: "skipped",
        reason: "aucun_template_associe",
        permissionsAssigned: 0,
      });
      continue;
    }

    if (!overwriteExisting && roleWithCode.rolePermission.length > 0) {
      details.push({
        roleId: roleWithCode.id,
        roleName: roleWithCode.nom,
        roleKey: roleWithCode.key,
        roleCode: roleWithCode.code,
        templateId: template.id,
        status: "skipped",
        reason: "role_deja_parametre",
        permissionsAssigned: roleWithCode.rolePermission.length,
      });
      continue;
    }

    const desiredCodes =
      template.permissionCodes === "*"
        ? allPermissionCodes
        : [...new Set(template.permissionCodes.map(normalizePermissionCode))];

    const missingCodes = desiredCodes.filter(
      (code) => !permissionIdByCode.has(code)
    );

    if (missingCodes.length) {
      throw new Error(
        `Permissions manquantes dans le catalogue pour le role "${roleWithCode.nom}": ${missingCodes.join(", ")}`
      );
    }

    const permissionIds = desiredCodes
      .map((code) => permissionIdByCode.get(code))
      .filter((value): value is number => Number.isFinite(value));

    const scopes = permissionIds.map((permissionId, index) => {
      const code = desiredCodes[index];
      const override = template.scopeOverrides?.[code];
      return {
        permissionId,
        portee: override ?? template.defaultScope,
      };
    });

    assignments.push({
      roleId: roleWithCode.id,
      permissionIds,
      scopes,
    });

    details.push({
      roleId: roleWithCode.id,
      roleName: roleWithCode.nom,
      roleKey: roleWithCode.key,
      roleCode: roleWithCode.code,
      templateId: template.id,
      status: "updated",
      permissionsAssigned: permissionIds.length,
    });
  }

  if (!dryRun) {
    await prisma.$transaction(async (tx) => {
      for (const update of roleCodeUpdates) {
        await tx.role.update({
          where: { id: update.roleId },
          data: { code: update.code },
        });
      }

      for (const assignment of assignments) {
        await tx.reglePorteeRole.deleteMany({
          where: { roleId: assignment.roleId },
        });
        await tx.rolePermission.deleteMany({
          where: { roleId: assignment.roleId },
        });

        if (assignment.permissionIds.length) {
          await tx.rolePermission.createMany({
            data: assignment.permissionIds.map((permissionId) => ({
              roleId: assignment.roleId,
              permissionId,
            })),
          });

          await tx.reglePorteeRole.createMany({
            data: assignment.scopes.map((item) => ({
              roleId: assignment.roleId,
              permissionId: item.permissionId,
              portee: item.portee,
            })),
          });
        }
      }
    });
  }

  const rolePermissionCountAfter = dryRun
    ? rolePermissionCountBefore +
      details
        .filter((detail) => detail.status === "updated")
        .reduce((sum, detail) => sum + detail.permissionsAssigned, 0)
    : await prisma.rolePermission.count();

  const rolesUpdated = details.filter((detail) => detail.status === "updated").length;
  const rolesSkipped = details.length - rolesUpdated;

  const summary: BootstrapSummary = {
    totalPermissionsInCatalog: permissions.length,
    rolePermissionCountBefore,
    rolePermissionCountAfter,
    roleCodesUpdated: roleCodeUpdates.length,
    rolesConsidered: details.length,
    rolesUpdated,
    rolesSkipped,
    details,
  };

  return summary;
}
