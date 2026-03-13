import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { requireAccessControlAccess } from "@/security/authorization";

export async function GET() {
  try {
    await requireAccessControlAccess(["permission.read"]);

    const permissions = await prisma.permisions.findMany({
      select: {
        id: true,
        code: true,
        _count: {
          select: {
            rolePermission: true,
          },
        },
      },
      orderBy: [{ code: "asc" }],
    });

    return NextResponse.json({ status: 200, data: permissions });
  } catch (error: any) {
    return NextResponse.json(
      { status: 403, message: error?.message ?? "Acces interdit" },
      { status: error?.message === "Non authentifie" ? 401 : 403 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAccessControlAccess(["permission.create"]);
    await req.json().catch(() => null);

    return NextResponse.json(
      {
        status: 405,
        message:
          "Les permissions sont definies par le developpeur dans le catalogue et synchronisees via le seed ou le chargement du catalogue.",
      },
      { status: 405 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { status: 403, message: error?.message ?? "Acces interdit" },
      { status: error?.message === "Non authentifie" ? 401 : 403 }
    );
  }
}
