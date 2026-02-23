// app/api/agent/stats/route.ts
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // On récupère l'ID de l'agent depuis les params ou session
    // Pour l'exemple on hardcode l'agentId = 1
    const users  : any = await getAuthenticatedUser()
    const agentId = users.userId
    

    const absences = await prisma.presence.count({
      where: { agentId, statut: "ABSENT" },
    });

    const presences = await prisma.presence.count({
      where: { agentId, statut: 'PRESENT' },
    });
    const conges = await prisma.demandeConge.findMany({
      where: { agentId, statut: "VALIDE" },
    });
    const demandeconges = await prisma.demandeConge.count({
      where: { agentId },
    });
    let totalJoursConge = 0;
    if(conges.length!==0){
        for (const conge of conges) {
      if (conge.dateDebut && conge.dateFin) {
        const debut = new Date(conge.dateDebut);
        const fin = new Date(conge.dateFin);

        const diffTime = fin.getTime() - debut.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24) + 1; // +1 pour inclure le jour de début

        totalJoursConge += diffDays;
      }
    }
    }
  
    console.log({ absences, presences, conges : totalJoursConge , demandeconges } , "dash Agents")
    return NextResponse.json({data : { absences, presences, conges : totalJoursConge , demandeconges }});
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Impossible de récupérer les stats" }, { status: 500 });
  }
}
