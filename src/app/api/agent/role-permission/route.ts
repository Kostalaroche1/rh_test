import { NextResponse } from "next/server";

import { PorteeDonnees } from "@/generated/prisma";
import prisma from "@/lib/prisma";
import { requireAccessControlAccess } from "@/security/authorization";
import {
  canManageRoleFromContext,
  filterRolesForContext,
  getAccessControlGovernanceContext,
  getAllowedScopesForContext,
  getRoleGovernance,
} from "@/server/access/access-control-governance";

export async function GET() {
  try {
    const auth = await requireAccessControlAccess(["role.read", "permission.read"]);
    const governanceContext = await getAccessControlGovernanceContext(auth);

    const [roles, permissions] = await Promise.all([
      prisma.role.findMany({
        select: {
          id: true,
          nom: true,
          key: true,
          code: true,
          description: true,
          actif: true,
          _count: {
            select: {
              utilisateurs: true,
              rolePermission: true,
            },
          },
          rolePermission: {
            select: {
              permissionId: true,
            },
          },
          reglesPortee: {
            select: {
              permissionId: true,
              portee: true,
            },
          },
        },
        orderBy: [{ nom: "asc" }],
      }),
      prisma.permisions.findMany({
        select: {
          id: true,
          code: true,
          libelle: true,
          module: true,
        },
        orderBy: [{ code: "asc" }],
      }),
    ]);

    const filteredRoles = await filterRolesForContext(governanceContext, roles);
    const enrichedRoles = await Promise.all(
      filteredRoles.map(async (role) => ({
        ...role,
        governance: {
          ...(await getRoleGovernance(role)),
          manageable: await canManageRoleFromContext(governanceContext, role),
        },
      }))
    );

    return NextResponse.json({
      status: 200,
      data: {
        roles: enrichedRoles,
        permissions,
        viewer: {
          administrationLevel: governanceContext.administrationLevel,
          isGlobalAdministrator: governanceContext.isGlobalAdministrator,
          managedProvinceCode: governanceContext.managedProvinceCode,
          managedProvinceName: governanceContext.managedProvinceName,
          canCreateRoles: governanceContext.canCreateRoles,
          canUpdateRoles: governanceContext.canUpdateRoles,
          canDeleteRoles: governanceContext.canDeleteRoles,
          canManagePermissionCatalog: governanceContext.canManagePermissionCatalog,
          allowedScopes: getAllowedScopesForContext(governanceContext),
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 403, message: error?.message ?? "Acces interdit" },
      { status: error?.message === "Non authentifie" ? 401 : 403 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAccessControlAccess(["role.update", "permission.read"]);
    const governanceContext = await getAccessControlGovernanceContext(auth);

    const body = await req.json();
    const roleId = Number(body?.roleId);
    const permissionIds: number[] = Array.isArray(body?.permissionIds)
      ? body.permissionIds
          .map((value: unknown) => Number(value))
          .filter((value: number): value is number => Number.isFinite(value))
      : [];
    const porteesInput =
      body?.portees && typeof body.portees === "object" && !Array.isArray(body.portees)
        ? body.portees
        : {};

    if (!Number.isFinite(roleId)) {
      return NextResponse.json(
        { status: 400, message: "roleId invalide." },
        { status: 400 }
      );
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true, key: true, code: true, nom: true },
    });

    if (!role) {
      return NextResponse.json(
        { status: 404, message: "Role introuvable." },
        { status: 404 }
      );
    }

    if (!(await canManageRoleFromContext(governanceContext, role))) {
      return NextResponse.json(
        { status: 403, message: "Vous ne pouvez modifier que les permissions des roles de votre espace d'administration." },
        { status: 403 }
      );
    }

    const uniquePermissionIds = [...new Set(permissionIds)];
    if (uniquePermissionIds.length) {
      const existingPermissions = await prisma.permisions.findMany({
        where: { id: { in: uniquePermissionIds } },
        select: { id: true },
      });

      if (existingPermissions.length !== uniquePermissionIds.length) {
        return NextResponse.json(
          { status: 400, message: "Une ou plusieurs permissions sont invalides." },
          { status: 400 }
        );
      }
    }

    const allowedScopes = new Set<PorteeDonnees>(getAllowedScopesForContext(governanceContext));
    const reglesPorteeData = uniquePermissionIds.map((permissionId) => {
      const rawPortee = porteesInput[String(permissionId)];
      if (!rawPortee) {
        throw new Error(`Portee manquante pour la permission ${permissionId}.`);
      }

      const requestedPortee = String(rawPortee) as PorteeDonnees;
      if (!allowedScopes.has(requestedPortee)) {
        throw new Error(`Portee non autorisee pour la permission ${permissionId}.`);
      }

      return {
        roleId,
        permissionId,
        portee: requestedPortee,
      };
    });

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({
        where: { roleId },
      }),
      prisma.reglePorteeRole.deleteMany({
        where: { roleId },
      }),
      ...(uniquePermissionIds.length
        ? [
            prisma.rolePermission.createMany({
              data: uniquePermissionIds.map((permissionId) => ({
                roleId,
                permissionId,
              })),
            }),
            prisma.reglePorteeRole.createMany({
              data: reglesPorteeData,
            }),
          ]
        : []),
    ]);

    const updatedRole = await prisma.role.findUnique({
      where: { id: roleId },
      select: {
        id: true,
        nom: true,
        key: true,
        code: true,
        actif: true,
        rolePermission: {
          select: {
            permissionId: true,
          },
        },
        reglesPortee: {
          select: {
            permissionId: true,
            portee: true,
          },
        },
      },
    });

    return NextResponse.json({ status: 200, data: updatedRole });
  } catch (error: any) {
    return NextResponse.json(
      { status: 403, message: error?.message ?? "Acces interdit" },
      { status: error?.message === "Non authentifie" ? 401 : 403 }
    );
  }
}
