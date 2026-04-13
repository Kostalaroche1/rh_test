export type StatutDemandeSoinPolyclinique =
  | "EN_ATTENTE"
  | "VALIDEE_DRH"
  | "REJETEE_DRH"
  | "DOSSIER_ETABLI";

export interface PolycliniqueAgentSnapshot {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  statut?: string | null;
  photo?: string | null;
}

export interface PolycliniqueDemandeItem {
  id: number;
  agentId: number;
  dateDemande: string;
  motif: string;
  symptomes?: string | null;
  statut: StatutDemandeSoinPolyclinique;
  commentaireDecision?: string | null;
  dateDecision?: string | null;
  agent?: PolycliniqueAgentSnapshot | null;
  validePar?: {
    id: number;
    login: string;
  } | null;
  dossierMedical?: {
    id: number;
    createdAt: string;
  } | null;
}

export interface PolycliniqueDossierItem {
  id: number;
  demandeSoinId: number;
  agentId: number;
  medecinUtilisateurId: number;
  resumeTraitements: string;
  traitementsSuivis?: string | null;
  observations?: string | null;
  fichierPath?: string | null;
  createdAt: string;
  agent?: PolycliniqueAgentSnapshot | null;
  medecinUtilisateur?: {
    id: number;
    login: string;
    agent?: PolycliniqueAgentSnapshot | null;
  } | null;
}

export interface PolycliniqueDashboardResponse {
  connectedAgent: PolycliniqueAgentSnapshot | null;
  stats: {
    totalDemandes: number;
    enAttente: number;
    validees: number;
    rejetees: number;
    dossiersMedicaux: number;
  };
  permissions: {
    canAccess: boolean;
    canRequest: boolean;
    canValidate: boolean;
    canCreateDossier: boolean;
    canReadDossier: boolean;
  };
  demandes: PolycliniqueDemandeItem[];
  demandesEnAttenteValidation: PolycliniqueDemandeItem[];
  demandesValideesSansDossier: PolycliniqueDemandeItem[];
  dossiersRecents: PolycliniqueDossierItem[];
}

type ApiResponse<T> = {
  status?: number;
  message?: string;
  data?: T;
};

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return { status: response.status, message: "Reponse invalide du serveur." };
  }
}

export async function GetPolycliniqueDashboard(): Promise<PolycliniqueDashboardResponse | null> {
  try {
    const response = await fetch("/api/polyclinique/dashboard", {
      method: "GET",
      cache: "no-store",
    });
    const json = await parseResponse<PolycliniqueDashboardResponse>(response);
    if (!response.ok) {
      return null;
    }
    return json.data ?? null;
  } catch (error) {
    console.error("GetPolycliniqueDashboard failed:", error);
    return null;
  }
}

export async function CreateDemandeSoinPolyclinique(payload: {
  motif: string;
  symptomes?: string;
}) {
  const response = await fetch("/api/polyclinique/demandes", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<PolycliniqueDemandeItem>(response);
}

export async function ValiderDemandeSoinPolyclinique(
  demandeId: number,
  payload: { decision: "VALIDEE_DRH" | "REJETEE_DRH"; commentaireDecision?: string }
) {
  const response = await fetch(`/api/polyclinique/demandes/${demandeId}/validation`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<PolycliniqueDemandeItem>(response);
}

export async function CreerDossierMedicalPolyclinique(
  demandeId: number,
  payload: {
    resumeTraitements: string;
    traitementsSuivis?: string;
    observations?: string;
    fichierPath?: string;
  }
) {
  const response = await fetch(`/api/polyclinique/demandes/${demandeId}/dossier`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseResponse<PolycliniqueDossierItem>(response);
}
