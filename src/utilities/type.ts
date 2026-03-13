import { Prisma } from "@/generated/prisma"; // adapte selon ton path

export type AgentWithDetails = Prisma.AgentGetPayload<{
  select: {
    id: true
    matricule: true
    genre: true
    prenom: true
    statut: true
    actif: true
    affectations: {
      select: {
        departement: {
          select: {
            id: true
            nom: true
          }
        }
        direction: {
          select: {
            id: true
            libelle: true
          }
        }
        grade: {
          select: {
            id: true
            libelle: true
          }
        }
        fonction: {
          select: {
            id: true
            libelle: true
            poste: {
              select: {
                id: true
                libelle: true
              }
            }
          }
        }
      }
    }
    presences: {
      select: {
        heureDepart: true
        statut: true
        heureArrivee: true
        validePar: {
          select: {
            compteAgent: {
              select: {
                agent: {
                  select: {
                    id: true
                    nom: true
                  }
                }
              }
            }
          }
        }
        confirmePar: {
          select: {
            compteAgent: {
              select: {
                agent: {
                  select: {
                    id: true
                    nom: true
                  }
                }
              }
            }
          }
        }
      }
    }
    demandeConge: {
      select: {
        id: true
        statut: true
      }
    }
  }
}>


export interface Agent {
  id: string;
  matricule: string;
  nom: string;
  postnom: string;
  prenom: string;
  statut: string;
  genre: string;
  actif: boolean;
  dateEntree: string;
  dateNaissance: string;
  etatCivil: "Célibataire" | "Marié(e)" | "Divorcé(e)" | "Veuf(ve)";
}

export interface User {
  id: string;
  login: string ;
  motDePasse: string;
}
export type Task = {
  id: number;
  header: string;
  status: string;
  target: string;
  limit: string;
  reviewer: string;
};

export type Roles = {
  id: number
  nom: string
  description: string
  actif: boolean
  _count: { utilisateurs: number }
  utilisateurs: any[]
}
export type BackendUser = {
  id: number
  login: string
  actif: boolean
  compteAgent: any | null
  roles: { nom: "ADMIN" | "SUPERVISEUR" | "AGENT" }[]
}
export type AgentRow = {
  id: number
  matricule: string
  nom: string
  prenom: string
  email: string
  role: "ADMIN" | "SUPERVISEUR" | "AGENT"
  statut: "ACTIF" | "INACTIF"
  hasAccount: boolean
}

export type Auth ={
  userId: number,
  nom: string,
  prenom: string,
  matricule: string,
  email: string,
  role: [
    {
      id: number,
      utilisateurId: number,
      roleId: number,
      dateAttribution: any,
      attribuePar: any,
      role: [Object]
    }
  ],}



export type TasksByType = {
  type: string; // ou tu peux utiliser un union type si tu connais tous les types possibles
  tasks: Task[];
};

export type Paie ={
  agentId: number,
  periode: String,
  datePaiement: String,
  salaireBase: number,
  brut: number,
  net: number,
  etat: String,
  primes: [
    { type: String, montant: number },
    { type: String, montant:number }
  ]
}
export type PaieWithPrimes = {
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

// type Agent = {
//   id: number
//   matricule: string
//   nom: string
//   prenom: string
//   statut: string
//   dateEntree: Date
//   actif: boolean
// }

export type TypeConge = {
  createur: any;
  id: number
  code: string
  libelle: string
  dureeMax: number
  allocationConge: number
}

export type DemandeConge = {
  id: number
  dateDebut: string | Date
  dateFin: string | Date
  dateDemande: string | Date
  motif?: string
  statut: string
  typeConge: {
    id: number
    libelle?: string
    code: string
    dureeMax?: number
  }
  agent: {
    id: number
    nom: string
    prenom: string
    postnom?: string
  }
  role?: string
  action?: string
}

export const emptyDemande: DemandeConge = {
  id: 0,
  dateDebut: "",
  dateFin: "",
  dateDemande: "",
  motif: "",
  statut: "",
  typeConge: {
    id: 0,
    code: "",
    dureeMax: 0,
  },
  agent: {
    id: 0,
    nom: "",
    prenom: "",
    postnom: "",
  },
  role: "",
  action: "",
}
export type EmptyDemande = DemandeConge
