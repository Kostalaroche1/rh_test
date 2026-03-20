import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { requireAccessControlAccess } from "@/security/authorization";

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
    await requireAccessControlAccess(["role.read"]);
  } catch (error: any) {
    return NextResponse.json(
      { status: 403, message: error?.message ?? "Acces interdit" },
      { status: error?.message === "Non authentifie" ? 401 : 403 }
    );
  }

  const roles = await prisma.role.findMany({
    select: {
      id: true,
      key: true,
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

  return NextResponse.json({ status: 200, data: roles });
}

export async function POST(req: Request) {
  try {
    await requireAccessControlAccess(["role.create"]);

    const body = await req.json();
    const nom = String(body?.nom ?? "").trim();
    const description = String(body?.description ?? "").trim() || null;
    const key = String(body?.key ?? nom)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");

    if (!nom) {
      return NextResponse.json(
        { status: 400, message: "Le nom du role est obligatoire." },
        { status: 400 }
      );
    }

    const existingRole = await prisma.role.findFirst({
      where: {
        OR: [{ nom }, { key }],
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
        nom,
        key,
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
    await requireAccessControlAccess(["role.update"]);

    const body = await req.json();
    const id = Number(body?.id);
    const nom = String(body?.nom ?? "").trim();
    const description = String(body?.description ?? "").trim() || null;
    const actif =
      typeof body?.actif === "boolean" ? body.actif : undefined;

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

    const key = String(body?.key ?? nom)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");

    const role = await prisma.role.findUnique({
      where: { id },
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

    if (!role) {
      return NextResponse.json(
        { status: 404, message: "Role introuvable." },
        { status: 404 }
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

    const existingRole = await prisma.role.findFirst({
      where: {
        id: { not: id },
        OR: [{ nom }, { key }],
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
        nom,
        key,
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
    await requireAccessControlAccess(["role.delete"]);

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
