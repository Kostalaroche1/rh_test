import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// ✅ Type corrigé pour TypeScript
type PaieWithPrimes = {
  id: number;
  periode: string;
  datePaiement: string | null;
  salaireBase: number;
  brut: number;
  net: number;
  etat: string;
  agent: {
    id: number;
    nom: string;
    matricule: string;
  };
  primes: {
    id: number;
    nom: string;
    montant: number;
  }[];
};

/**
 * GET : Récupère toutes les paies d’un agent spécifique avec ses primes
 */
export async function GET(
  req: Request
) {

  const {searchParams} =  new URL(req.url)
  const agentId = searchParams.get('agentId')
 

  if (!agentId) {
    return NextResponse.json(
      { error: "AgentId requis" },
      { status: 400 }
    );
  }

  try {
    const paies = await prisma.paie.findMany({
      where: { agentId: Number(agentId) },
      include: {
        agent: true,
        primes: true,
      },
      orderBy: { periode: "desc" },
    });

    // 🔹 Conversion des dates pour correspondre au type
    const formatted = paies.map(p => ({
      ...p,
      datePaiement: p.datePaiement ? p.datePaiement.toISOString() : null,
      agent: {
        id: p.agent.id,
        nom: p.agent.nom,
        matricule: p.agent.matricule,
      },
      primes: p.primes.map(pr => ({
        id: pr.id,
        nom: pr.type,   // adapte si tu veux garder le nom exact
        montant: Number(pr.montant)
      }))
    }));

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error("Erreur getPaiesByAgent:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
