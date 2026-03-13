import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { requireAccessControlAccess } from "@/security/authorization";

export async function GET() {
  try {
    await requireAccessControlAccess(["role.read", "permission.read"]);

    const [roles, permissions] = await Promise.all([
      prisma.role.findMany({
        select: {
          id: true,
          nom: true,
          key: true,
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
        },
        orderBy: [{ nom: "asc" }],
      }),
      prisma.permisions.findMany({
        select: {
          id: true,
          code: true,
        },
        orderBy: [{ code: "asc" }],
      }),
    ]);

    return NextResponse.json({ status: 200, data: { roles, permissions } });
  } catch (error: any) {
    return NextResponse.json(
      { status: 403, message: error?.message ?? "Acces interdit" },
      { status: error?.message === "Non authentifie" ? 401 : 403 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    await requireAccessControlAccess(["role.update", "permission.read"]);

    const body = await req.json();
    const roleId = Number(body?.roleId);
    const permissionIds: number[] = Array.isArray(body?.permissionIds)
      ? body.permissionIds
          .map((value: unknown) => Number(value))
          .filter((value: number): value is number => Number.isFinite(value))
      : [];

    if (!Number.isFinite(roleId)) {
      return NextResponse.json(
        { status: 400, message: "roleId invalide." },
        { status: 400 }
      );
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
      select: { id: true },
    });

    if (!role) {
      return NextResponse.json(
        { status: 404, message: "Role introuvable." },
        { status: 404 }
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

    await prisma.$transaction([
      prisma.rolePermission.deleteMany({
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
          ]
        : []),
    ]);

    const updatedRole = await prisma.role.findUnique({
      where: { id: roleId },
      select: {
        id: true,
        nom: true,
        key: true,
        actif: true,
        rolePermission: {
          select: {
            permissionId: true,
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
