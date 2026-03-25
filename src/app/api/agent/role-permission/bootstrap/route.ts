import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/security/auth";
import { canManageAccessControl } from "@/security/permissions";
import {
  applyDefaultRolePermissions,
  getRolePermissionCount,
} from "@/server/access/role-permission-bootstrap";

function secureEquals(left: string, right: string) {
  const leftBytes = Buffer.from(left);
  const rightBytes = Buffer.from(right);

  if (leftBytes.length !== rightBytes.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    result |= leftBytes[index] ^ rightBytes[index];
  }

  return result === 0;
}

function hasValidBootstrapToken(req: Request) {
  const expected = process.env.ACCESS_BOOTSTRAP_TOKEN?.trim();
  const provided = req.headers.get("x-access-bootstrap-token")?.trim();

  if (!expected || !provided) {
    return false;
  }

  return secureEquals(provided, expected);
}

export async function POST(req: Request) {
  const payload = await req.json().catch(() => ({} as any));
  const overwriteExisting = Boolean(payload?.overwriteExisting);
  const includeInactiveRoles = Boolean(payload?.includeInactiveRoles);
  const dryRun = Boolean(payload?.dryRun);

  const auth = await getAuthenticatedUser();
  const hasAccessControlSession = canManageAccessControl(auth);
  const tokenMode = hasValidBootstrapToken(req);

  if (!hasAccessControlSession && !tokenMode) {
    return NextResponse.json(
      {
        status: 403,
        message:
          "Acces interdit. Fournissez un token valide (header x-access-bootstrap-token) ou utilisez une session ayant les droits d'administration d'acces.",
      },
      { status: 403 }
    );
  }

  if (tokenMode) {
    const linksCount = await getRolePermissionCount();
    if (linksCount > 0) {
      return NextResponse.json(
        {
          status: 409,
          message:
            "Le mode token de bootstrap est reserve a l'initialisation (aucune permission role liee).",
          data: { rolePermissionCount: linksCount },
        },
        { status: 409 }
      );
    }
  }

  try {
    const summary = await applyDefaultRolePermissions({
      overwriteExisting,
      includeInactiveRoles,
      dryRun,
    });

    return NextResponse.json({
      status: 200,
      data: summary,
      message: dryRun
        ? "Simulation de bootstrap terminee."
        : "Bootstrap des permissions par role termine.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 500, message: error?.message ?? "Bootstrap echoue." },
      { status: 500 }
    );
  }
}

