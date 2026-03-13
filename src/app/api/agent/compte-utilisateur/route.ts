import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/security/auth";
import { listerComptesAgent } from "@/app/application/agent/compteAgent/listerCompteAgent";
import { lierCompte } from "@/app/application/agent/compteAgent/lierCompte";
import { requireAccess } from "@/security/authorization";

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non authentifie" }, { status: 401 });
  }
  try {
    await requireAccess({
      permissions: ["user.read", "agent.read"],
    });
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }
  const liste = await listerComptesAgent();
  return NextResponse.json({ data: liste }, { status: 200 });
}

export async function POST(req: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non authentifie" }, { status: 401 });
  }
  try {
    await requireAccess({
      permissions: ["user.update", "agent.update"],
    });
  } catch {
    return NextResponse.json({ message: "Acces interdit" }, { status: 403 });
  }
  const { agentId, utilisateurId, liePar } = await req.json();
  const linked = await lierCompte(agentId, utilisateurId, liePar);
  return NextResponse.json(linked, { status: 200 });
}

