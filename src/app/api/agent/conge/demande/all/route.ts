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
      permissions: ["conge.read", "conge.confirm", "conge.validate"],
    });
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }

  const getData = await prisma.demandeConge.findMany({
    include: {
      typeConge: true,
      agent: true,
    },
    orderBy: [{ dateDemande: "desc" }, { id: "desc" }],
  });

  return NextResponse.json({ status: 200, getData }, { status: 200 });
}

