 // optionnel, tu peux créer un fichier types

import { PaieWithPrimes } from "@/utilities/type";

export async function getPaiesByAgent(agentId: number) {
  console.log(agentId , "ID de Agent")
  if (!agentId) return [];

  try {
    const res = await fetch(`/api/paie/getPaiesByAgent?agentId=${agentId}`);
    if (!res.ok) throw new Error("Erreur fetch paies");
    const data: any = await res.json();
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
}
