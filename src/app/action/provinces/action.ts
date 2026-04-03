export interface ProvinceItem {
  id: number;
  code: string;
  nom: string;
  description?: string | null;
  actif: boolean;
  _count?: {
    types?: number;
    unites?: number;
    affectations?: number;
  };
}

export async function GetProvinces(): Promise<ProvinceItem[]> {
  const response = await fetch("../api/provinces", {
    method: "GET",
    next: { revalidate: 10 },
  });
  const json = await response.json();
  return Array.isArray(json?.data) ? json.data : [];
}

export async function CreateProvince(data: Partial<ProvinceItem>) {
  const response = await fetch("../api/provinces", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function UpdateProvince(
  data: Partial<ProvinceItem> & { id: number }
) {
  const response = await fetch("../api/provinces", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function DeleteProvince(data: { id: number }) {
  const response = await fetch("../api/provinces", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}
