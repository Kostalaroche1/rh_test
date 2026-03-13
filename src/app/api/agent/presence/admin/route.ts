import { NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { requireAccess } from "@/security/authorization";

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non autorise" }, { status: 401 });
  }

  try {
    await requireAccess({
      permissions: ["presence.read", "presence.confirm", "presence.validate"],
    });
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const getData = await prisma.presence.findMany({
    include: {
      agent: true,
      confirmePar: true,
      validePar: true,
    },
    orderBy: [{ date: "desc" }, { id: "desc" }],
  });

  return NextResponse.json({ status: 200, rest: "GET", getData }, { status: 200 });
}

