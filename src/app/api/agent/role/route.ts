import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { requireAccessControlAccess } from "@/security/authorization";
import {
  buildRoleNamespacePayload,
  canManageRoleFromContext,
  filterRolesForContext,
  getAccessControlGovernanceContext,
  getRoleGovernance,
} from "@/server/access/access-control-governance";

const ACCESS_CONTROL_PERMISSION_CODES = [
  "role.read",
  "role.create",
  "role.update",
  "role.delete",
  "permission.read",
  "permission.create",
  "permission.update",
  "permission.delete",
] as const;

function isAccessControlRole(role: {
  actif?: boolean;
  rolePermission?: Array<{ permission?: { code?: string | null } | null }>;
}) {
  if (!role?.actif) {
    return false;
  }

  const codes = new Set(
    (role.rolePermission ?? [])
      .map((item) => String(item.permission?.code ?? "").trim().toLowerCase())
      .filter(Boolean)
  );

  return ACCESS_CONTROL_PERMISSION_CODES.some((code) => codes.has(code));
}

async function hasAnotherAccessControlRole(excludedRoleId: number) {
  const roles = await prisma.role.findMany({
    where: {
      id: { not: excludedRoleId },
      actif: true,
    },
    select: {
      id: true,
      actif: true,
      rolePermission: {
        select: {
          permission: {
            select: { code: true },
          },
        },
      },
    },
  });

  return roles.some((role) => isAccessControlRole(role));
}

export async function GET() {
  try {
    const auth = await requireAccessControlAccess(["role.read"]);
    const governanceContext = await getAccessControlGovernanceContext(auth);

    const roles = await prisma.role.findMany({
      select: {
        id: true,
        key: true,
        code: true,
        nom: true,
        description: true,
        actif: true,
        _count: {
          select: {
            utilisateurs: true,
            rolePermission: true,
          },
        },
      },
      orderBy: [{ nom: "asc" }],
    });

    const filteredRoles = await filterRolesForContext(governanceContext, roles);
    const data = await Promise.all(
      filteredRoles.map(async (role) => {
        const roleGovernance = await getRoleGovernance(role);
        return {
          ...role,
          governance: {
            ...roleGovernance,
            manageable: await canManageRoleFromContext(governanceContext, role),
          },
        };
      })
    );

    return NextResponse.json({
      status: 200,
      data,
      viewer: {
        administrationLevel: governanceContext.administrationLevel,
        isGlobalAdministrator: governanceContext.isGlobalAdministrator,
        managedProvinceCode: governanceContext.managedProvinceCode,
        managedProvinceName: governanceContext.managedProvinceName,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 403, message: error?.message ?? "Acces interdit" },
      { status: error?.message === "Non authentifie" ? 401 : 403 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAccessControlAccess(["role.create"]);
    const governanceContext = await getAccessControlGovernanceContext(auth);

    if (governanceContext.administrationLevel === "NONE") {
      return NextResponse.json(
        { status: 403, message: "Votre portee ne permet pas de creer des roles." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const nom = String(body?.nom ?? "").trim();
    const description = String(body?.description ?? "").trim() || null;

    if (!nom) {
      return NextResponse.json(
        { status: 400, message: "Le nom du role est obligatoire." },
        { status: 400 }
      );
    }

    const namespacePayload = buildRoleNamespacePayload(nom, governanceContext);

    const existingRole = await prisma.role.findFirst({
      where: {
        OR: [
          { nom: namespacePayload.nom },
          { key: namespacePayload.key },
          { code: namespacePayload.code },
        ],
      },
      select: { id: true },
    });

    if (existingRole) {
      return NextResponse.json(
        { status: 400, message: "Ce role existe deja." },
        { status: 400 }
      );
    }

    const role = await prisma.role.create({
      data: {
        nom: namespacePayload.nom,
        key: namespacePayload.key,
        code: namespacePayload.code,
        description,
      },
    });

    return NextResponse.json({ status: 200, data: role });
  } catch (error: any) {
    return NextResponse.json(
      { status: 403, message: error?.message ?? "Acces interdit" },
      { status: error?.message === "Non authentifie" ? 401 : 403 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAccessControlAccess(["role.update"]);
    const governanceContext = await getAccessControlGovernanceContext(auth);

    const body = await req.json();
    const id = Number(body?.id);
    const nom = String(body?.nom ?? "").trim();
    const description = String(body?.description ?? "").trim() || null;
    const actif = typeof body?.actif === "boolean" ? body.actif : undefined;

    if (!Number.isFinite(id)) {
      return NextResponse.json(
        { status: 400, message: "id invalide." },
        { status: 400 }
      );
    }

    if (!nom) {
      return NextResponse.json(
        { status: 400, message: "Le nom du role est obligatoire." },
        { status: 400 }
      );
    }

    const role = await prisma.role.findUnique({
      where: { id },
      select: {
        id: true,
        key: true,
        code: true,
        nom: true,
        actif: true,
        rolePermission: {
          select: {
            permission: {
              select: { code: true },
            },
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        { status: 404, message: "Role introuvable." },
        { status: 404 }
      );
    }

    if (!(await canManageRoleFromContext(governanceContext, role))) {
      return NextResponse.json(
        { status: 403, message: "Vous ne pouvez modifier que les roles de votre espace d'administration." },
        { status: 403 }
      );
    }

    if (actif === false && isAccessControlRole(role)) {
      const hasBackupRole = await hasAnotherAccessControlRole(id);
      if (!hasBackupRole) {
        return NextResponse.json(
          {
            status: 400,
            message:
              "Impossible de desactiver le dernier role donnant acces a la gestion des roles et permissions.",
          },
          { status: 400 }
        );
      }
    }

    const namespacePayload = buildRoleNamespacePayload(nom, governanceContext);
    const existingRole = await prisma.role.findFirst({
      where: {
        id: { not: id },
        OR: [
          { nom: namespacePayload.nom },
          { key: namespacePayload.key },
          { code: namespacePayload.code },
        ],
      },
      select: { id: true },
    });

    if (existingRole) {
      return NextResponse.json(
        { status: 400, message: "Un autre role utilise deja ce nom ou cette cle." },
        { status: 400 }
      );
    }

    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        nom: namespacePayload.nom,
        key: namespacePayload.key,
        code: namespacePayload.code,
        description,
        ...(actif === undefined ? {} : { actif }),
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

export async function DELETE(req: Request) {
  try {
    const auth = await requireAccessControlAccess(["role.delete"]);
    const governanceContext = await getAccessControlGovernanceContext(auth);

    const body = await req.json();
    const id = Number(body?.id);

    if (!Number.isFinite(id)) {
      return NextResponse.json(
        { status: 400, message: "id invalide." },
        { status: 400 }
      );
    }

    const role = await prisma.role.findUnique({
      where: { id },
      select: {
        id: true,
        key: true,
        code: true,
        nom: true,
        actif: true,
        rolePermission: {
          select: {
            permission: {
              select: { code: true },
            },
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        { status: 404, message: "Role introuvable." },
        { status: 404 }
      );
    }

    if (!(await canManageRoleFromContext(governanceContext, role))) {
      return NextResponse.json(
        { status: 403, message: "Vous ne pouvez supprimer que les roles de votre espace d'administration." },
        { status: 403 }
      );
    }

    if (isAccessControlRole(role)) {
      const hasBackupRole = await hasAnotherAccessControlRole(id);
      if (!hasBackupRole) {
        return NextResponse.json(
          {
            status: 400,
            message:
              "Impossible de supprimer le dernier role donnant acces a la gestion des roles et permissions.",
          },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({
        where: { roleId: id },
      }),
      prisma.reglePorteeRole.deleteMany({
        where: { roleId: id },
      }),
      prisma.role.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({ status: 200, success: true });
  } catch (error: any) {
    return NextResponse.json(
      { status: 403, message: error?.message ?? "Acces interdit" },
      { status: error?.message === "Non authentifie" ? 401 : 403 }
    );
  }
}
