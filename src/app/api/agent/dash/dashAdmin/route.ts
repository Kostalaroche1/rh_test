// app/api/agent/stats/route.ts
import prisma from "@/lib/prisma";
import { getAuthenticatedUser } from "@/security/auth";
import { AgentWithDetails } from "@/utilities/type";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // On récupère l'ID de l'agent depuis les params ou session
    // Pour l'exemple on hardcode l'agentId = 1
    const users  : any = await getAuthenticatedUser()
    const agentsActif = await prisma.agent.count({
      where: {  actif : true },
    });

    const absences = await prisma.presence.count({
      where: {  statut: 'ABSENT' },
    });

    const presences = await prisma.presence.count({
      where: { statut: 'PRESENT' },
    });

    const conges = await prisma.demandeConge.findMany({
      where: { statut: 'VALIDE' },
    });
    const demandeconges = await prisma.demandeConge.count();
     const congesAttente = await prisma.demandeConge.count({
      where : {
        statut : 'EN_ATTENTE'
      }
     });
     const congesConfirme = await prisma.demandeConge.count({
      where : {
        statut : 'CONFIRME'
      }
     });
     const congesRejete = await prisma.demandeConge.count({
      where : {
        statut : 'REJETE'
      }
     });
     const sites = await prisma.site.count()
     const directions = await prisma.direction.count()
     const departements = await prisma.departement.count()
     const fonctions = await prisma.fonction.count()
     const postes = await prisma.poste.count()
     const affectations = await prisma.affectation.count()
    let totalJoursConge = 0;

    for (const conge of conges) {
      if (conge.dateDebut && conge.dateFin) {
        const debut = new Date(conge.dateDebut);
        const fin = new Date(conge.dateFin);

        const diffTime = fin.getTime() - debut.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24) + 1; // +1 pour inclure le jour de début

        totalJoursConge += diffDays;
      }
    }
    const AgentsServicesPresences : AgentWithDetails[] = await prisma.agent.findMany({
      select : {
        id : true,
        matricule : true,
        genre : true,
        prenom : true,
        nom : true,
        statut : true,
        affectations : {
          select : {
            departement : {
              select : {
                id : true,
                nom : true
              }
            },
            direction : {
              select : {
                id : true,
                libelle : true
              }
            },
            grade : {
              select : {
                id : true,
                libelle : true
              }
            },
            fonction : {
              select : {
                id : true,
                libelle : true,
                poste : {
                  select : {
                    id : true,
                    libelle : true
                  }
                }
              }
            },
          }
        },
        presences : {
          select : {
            heureDepart : true,
            statut : true,
            heureArrivee : true,
            date : true,
            validePar : {
              select : {
                compteAgent : {
                  select : {
                    agent : {
                      select : {
                        id : true,
                        nom : true
                      }
                    }
                  }
                }
              }
            },
            confirmePar : {
              select : {
                compteAgent : {
                  select : {
                    agent : {
                      select : {
                        id : true,
                        nom : true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        actif : true,
        demandeConge : {
          select : {
            id : true,
            statut : true
          }
        }
      }
    })
    const congesStatut : congesStatut = {
      valide : conges,
      enattente : congesAttente,
      confirm: congesConfirme,
      rejete : congesRejete
    }
    const organisation : organisation = {
      affectation : affectations,
      direction : directions,
      departement : departements,
      fonctions : fonctions,
      postes : postes,
      sites : sites
    }
    console.log({ absences, presences, conges : totalJoursConge , demandeconges , congesStatut, AgentsServicesPresences , organisation   } , "dash Agents")
    return NextResponse.json(
      {data :
         { absences, presences, conges : totalJoursConge 
          , demandeconges , actif :agentsActif , 
          enconges : conges.length , AgentsPresences : AgentsServicesPresences 
           , congesStatut : congesStatut ,
           organisation : organisation
        }});
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Impossible de récupérer les stats" }, { status: 500 });
  }
}


export type  congesStatut = {
      valide : Object,
      enattente : number,
      confirm: number,
      rejete : number
    }
    export type  organisation = {
      sites : Object,
      departement : number,
      direction: number,
      affectation : number
       postes: number,
      fonctions : number
    }