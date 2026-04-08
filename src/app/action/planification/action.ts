export interface TypePlanificationItem {
  id: number;
  nom: string;
  code: string;
  description?: string | null;
  actif: boolean;
  systeme: boolean;
}

export interface PlanificationParticipantItem {
  id?: number;
  agentId: number;
  roleDansPlan?: "BENEFICIAIRE" | "RESPONSABLE" | "SUPERVISEUR" | "INTERVENANT";
  obligatoire?: boolean;
}

export interface RappelPlanificationItem {
  id?: number;
  dateRappel: string;
  canal?: "APP" | "EMAIL" | "SMS";
  message?: string | null;
  envoye?: boolean;
}

export interface PlanificationItem {
  id: number;
  titre: string;
  description?: string | null;
  typePlanificationId: number;
  dateDebut: string;
  dateFin?: string | null;
  statut: "BROUILLON" | "PLANIFIE" | "EN_COURS" | "TERMINE" | "ANNULE" | "REPORTE";
  priorite: "FAIBLE" | "NORMALE" | "ELEVEE" | "CRITIQUE";
  uniteOrganisationnelleId?: number | null;
  creeParId: number;
  assigneParId?: number | null;
  valideParId?: number | null;
  dateValidation?: string | null;
  demandeCongeId?: number | null;
  affectationId?: number | null;
  notes?: string | null;
  participants?: PlanificationParticipantItem[];
  rappels?: RappelPlanificationItem[];
}

export async function GetTypesPlanification(): Promise<TypePlanificationItem[]> {
  const response = await fetch("../api/type-planifications", {
    method: "GET",
    next: { revalidate: 10 },
  });
  const json = await response.json();
  return Array.isArray(json?.data) ? json.data : [];
}

export async function CreateTypePlanification(data: Partial<TypePlanificationItem>) {
  const response = await fetch("../api/type-planifications", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function UpdateTypePlanification(data: Partial<TypePlanificationItem> & { id: number }) {
  const response = await fetch("../api/type-planifications", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function DeleteTypePlanification(data: { id: number }) {
  const response = await fetch("../api/type-planifications", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function GetPlanifications(): Promise<PlanificationItem[]> {
  const response = await fetch("../api/planifications", {
    method: "GET",
    next: { revalidate: 10 },
  });
  const json = await response.json();
  return Array.isArray(json?.data) ? json.data : [];
}

export async function CreatePlanification(data: Partial<PlanificationItem>) {
  const response = await fetch("../api/planifications", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function UpdatePlanification(data: Partial<PlanificationItem> & { id: number }) {
  const response = await fetch("../api/planifications", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function DeletePlanification(data: { id: number }) {
  const response = await fetch("../api/planifications", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}
