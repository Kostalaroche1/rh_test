import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";
import { hasAnyPermission } from "@/security/permissions";
import { getRoleIds } from "@/security/roles";
import { getPermissionScopesForUser } from "@/server/access/scope";
import { NextResponse } from "next/server";

function buildReadableScope(user: {
  compteId?: number | null;
  roleIds: number[];
  admin: boolean;
  selfOnly: boolean;
}) {
  if (user.admin) return {};

  if (user.selfOnly) {
    return {
      compteId: Number(user.compteId ?? -1),
    };
  }

  return {
    OR: [
      { compteId: null, roleId: null },
      ...(user.compteId ? [{ compteId: Number(user.compteId) }] : []),
      ...(user.roleIds.length ? [{ roleId: { in: user.roleIds } }] : []),
    ],
  };
}

async function resolveCompteIdsForRoleId(roleId: number) {
  const assignments = await prisma.utilisateurRole.findMany({
    where: {
      roleId,
      role: { actif: true },
      utilisateur: {
        actif: true,
        compteAgent: {
          isNot: null,
        },
      },
    },
    select: {
      utilisateur: {
        select: {
          compteAgent: {
            select: { id: true },
          },
        },
      },
    },
  });

  return [
    ...new Set(
      assignments
        .map((item) => item.utilisateur.compteAgent?.id ?? null)
        .filter((value): value is number => Number.isFinite(value))
    ),
  ];
}

async function isNotificationSelfOnlyScope(userId: number) {
  const scopes = await getPermissionScopesForUser(userId, ["notification.read"]);
  return (
    scopes.length > 0 &&
    scopes.includes("SOI_MEME") &&
    scopes.every((scope) => scope === "SOI_MEME")
  );
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ data: [] }, { status: 200 });

    try {
      await requireAccess({
        permissions: ["notification.read"],
      });
    } catch {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const roleIds = getRoleIds(user);
    const admin = hasAnyPermission(user, ["notification.create", "notification.update", "notification.delete"]);
    const selfOnly = await isNotificationSelfOnlyScope(user.userId);

    const notifications = await prisma.notification.findMany({
      where: buildReadableScope({
        compteId: user.compteId ?? null,
        roleIds,
        admin,
        selfOnly,
      }),
      include: { role: true, compte: true },
      orderBy: { dateEnvoi: "desc" },
    });

    return NextResponse.json({ data: notifications }, { status: 200 });
  } catch (error) {
    console.error("GET /api/notification failed:", error);
    return NextResponse.json(
      { error: "Impossible de recuperer les notifications" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    try {
      await requireAccess({
        permissions: ["notification.create"],
      });
    } catch {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const body = await req.json();
    const compteId =
      body.compteId === null || body.compteId === undefined
        ? null
        : Number(body.compteId);
    const roleId =
      body.roleId === null || body.roleId === undefined
        ? null
        : Number(body.roleId);
    const agentId =
      body.agentId === null || body.agentId === undefined
        ? null
        : Number(body.agentId);

    let targetCompteIds: number[] = [];

    if (Number.isFinite(compteId)) {
      targetCompteIds = [Number(compteId)];
    } else if (Number.isFinite(agentId)) {
      const compte = await prisma.compteAgent.findUnique({
        where: { agentId: Number(agentId) },
        select: { id: true },
      });
      targetCompteIds = compte ? [compte.id] : [];
    } else if (Number.isFinite(roleId)) {
      targetCompteIds = await resolveCompteIdsForRoleId(Number(roleId));
    }

    if (!targetCompteIds.length && (roleId !== null || agentId !== null)) {
      return NextResponse.json({ data: [] }, { status: 201 });
    }

    const rows = targetCompteIds.length
      ? await prisma.$transaction(
          targetCompteIds.map((targetCompteId) =>
            prisma.notification.create({
              data: {
                compteId: targetCompteId,
                roleId: null,
                titre: body.titre,
                message: body.message,
                type: body.type ?? "INFO",
                url: body.url ?? null,
                icon: body.icon ?? "bell",
                statut: body.statut ?? "NON_LU",
                expedider: body.expedider ?? "SYSTEM",
                dateEnvoi: new Date(),
              },
              include: { role: true, compte: true },
            })
          )
        )
      : [
          await prisma.notification.create({
            data: {
              compteId: null,
              roleId: null,
              titre: body.titre,
              message: body.message,
              type: body.type ?? "INFO",
              url: body.url ?? null,
              icon: body.icon ?? "bell",
              statut: body.statut ?? "NON_LU",
              expedider: body.expedider ?? "SYSTEM",
              dateEnvoi: new Date(),
            },
            include: { role: true, compte: true },
          }),
        ];

    return NextResponse.json(
      { data: rows.length === 1 ? rows[0] : rows },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/notification failed:", error);
    return NextResponse.json(
      { error: "Impossible de creer la notification" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    try {
      await requireAccess({
        permissions: ["notification.update"],
      });
    } catch {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const { id, statut } = await req.json();
    const notifId = Number(id);
    if (!Number.isFinite(notifId)) {
      return NextResponse.json({ error: "id invalide" }, { status: 400 });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notifId },
      select: { id: true, compteId: true, roleId: true },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification introuvable" },
        { status: 404 }
      );
    }

    const roleIds = getRoleIds(user);
    const admin = hasAnyPermission(user, ["notification.create", "notification.update", "notification.delete"]);
    const selfOnly = await isNotificationSelfOnlyScope(user.userId);
    const canRead =
      (selfOnly
        ? notification.compteId != null &&
          Number(notification.compteId) === Number(user.compteId ?? -1)
        : admin ||
          (notification.compteId == null && notification.roleId == null) ||
          (notification.compteId != null &&
            Number(notification.compteId) === Number(user.compteId ?? -1)) ||
          (notification.roleId != null && roleIds.includes(Number(notification.roleId))));

    if (!canRead) {
      return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
    }

    const updated = await prisma.notification.update({
      where: { id: notifId },
      data: { statut: statut === "NON_LU" ? "NON_LU" : "LU" },
    });

    return NextResponse.json({ data: updated }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/notification failed:", error);
    return NextResponse.json(
      { error: "Impossible de mettre a jour la notification" },
      { status: 500 }
    );
  }
}
