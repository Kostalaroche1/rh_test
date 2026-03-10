type HoraireAgentPayload = {
  id?: number;
  agentId?: number;
  horaireId?: number;
  dateDebut?: string;
  dateFin?: string;
  lundi?: boolean;
  mardi?: boolean;
  mercredi?: boolean;
  jeudi?: boolean;
  vendredi?: boolean;
  samedi?: boolean;
  dimanche?: boolean;
};

export async function GetHoraireAgent() {
  const res = await fetch("../api/agent/horaireAgent", {
    method: "GET",
    cache: "no-store",
  });

  const response = await res.json();
  if (!res.ok) {
    throw new Error(response?.message ?? "Impossible de charger les horaires agent");
  }

  return response;
}

export async function AddHoraireAgent(data: HoraireAgentPayload) {
  const res = await fetch("../api/agent/horaireAgent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const response = await res.json();
  if (!res.ok) {
    throw new Error(response?.message ?? "Impossible de creer cet horaire agent");
  }

  return response;
}

export async function UpdateHoraireAgent(data: HoraireAgentPayload) {
  const res = await fetch("../api/agent/horaireAgent", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const response = await res.json();
  if (!res.ok) {
    throw new Error(response?.message ?? "Impossible de modifier cet horaire agent");
  }

  return response;
}

export async function DeleteHoraireAgent(data: { id: number }) {
  const res = await fetch("../api/agent/horaireAgent", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const response = await res.json();
  if (!res.ok) {
    throw new Error(response?.message ?? "Impossible de supprimer cet horaire agent");
  }

  return response;
}
