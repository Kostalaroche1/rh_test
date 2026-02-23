import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const currentYear = new Date().getFullYear();

    const agents = await prisma.agent.findMany({
      where: {
        actif: true,
        datenais: {
          lte: new Date(`${currentYear - 60}-12-31`), // âge >= 60
        },
      },
      select: { id: true, nom: true, prenom: true, datenais: true },
    });

    const data = agents.map(a => ({
      ...a,
      age: currentYear - a.datenais.getFullYear(),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
