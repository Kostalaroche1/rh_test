type HoraireTravailPayload = {
  id?: number;
  nomHoraire?: string;
  heureDebut?: string;
  heureFin?: string;
};

export async function GetHoraireTravail() {
  const res = await fetch("../api/agent/horaireTravail", {
    method: "GET",
    cache: "no-store",
  });

  const response = await res.json();
  if (!res.ok) {
    throw new Error(response?.message ?? "Impossible de charger les horaires");
  }

  return Array.isArray(response?.data) ? response.data : [];
}

export async function AddHoraireTravail(data: HoraireTravailPayload) {
  const res = await fetch("../api/agent/horaireTravail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const response = await res.json();
  if (!res.ok) {
    throw new Error(response?.message ?? "Impossible de creer cet horaire");
  }

  return response;
}

export async function UpdateHoraireTravail(data: HoraireTravailPayload) {
  const res = await fetch("../api/agent/horaireTravail", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const response = await res.json();
  if (!res.ok) {
    throw new Error(response?.message ?? "Impossible de modifier cet horaire");
  }

  return response;
}

export async function DeleteHoraireTravail(data: { id: number }) {
  const res = await fetch("../api/agent/horaireTravail", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const response = await res.json();
  if (!res.ok) {
    throw new Error(response?.message ?? "Impossible de supprimer cet horaire");
  }

  return response;
}
