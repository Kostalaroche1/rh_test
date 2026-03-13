import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { requireAccessControlAccess } from "@/security/authorization";
import { DEFAULT_PERMISSION_CODES } from "@/server/access/permission-catalog";

export async function POST() {
  try {
    await requireAccessControlAccess(["permission.create", "permission.update"]);

    const existing = await prisma.permisions.findMany({
      select: { code: true },
    });

    const existingCodes = new Set(
      existing.map((item) => item.code.trim().toLowerCase())
    );

    const missingCodes = DEFAULT_PERMISSION_CODES.filter(
      (code) => !existingCodes.has(code)
    );

    if (missingCodes.length) {
      await prisma.permisions.createMany({
        data: missingCodes.map((code) => ({ code })),
      });
    }

    return NextResponse.json({
      status: 200,
      data: {
        total: DEFAULT_PERMISSION_CODES.length,
        created: missingCodes.length,
        existing: DEFAULT_PERMISSION_CODES.length - missingCodes.length,
        codes: DEFAULT_PERMISSION_CODES,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 403, message: error?.message ?? "Acces interdit" },
      { status: error?.message === "Non authentifie" ? 401 : 403 }
    );
  }
}
