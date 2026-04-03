export interface TypeUniteOrganisationnelleItem {
  id: number;
  nom: string;
  code: string;
  description?: string | null;
  parentId?: number | null;
  ordre: number;
  actif: boolean;
  systeme: boolean;
  parent?: {
    id: number;
    nom: string;
    code: string;
    parentId?: number | null;
  } | null;
  enfants?: Array<{
    id: number;
    nom: string;
    code: string;
    parentId?: number | null;
  }>;
  typeOrgaUniteProvinces?: Array<{
    id: number;
    provinceId: number;
    uniteOrganisationnelleId?: number | null;
    actif: boolean;
    province?: {
      id: number;
      nom: string;
      code: string;
    };
  }>;
}

export interface UniteOrganisationnelleItem {
  id: number;
  mappingId?: number;
  typeOrgaUniteProvinceId?: number;
  nom: string;
  code: string;
  description?: string | null;
  parentId?: number | null;
  provinceId?: number | null;
  niveau: number;
  actif: boolean;
  typeUniteId: number;
  typeUnite?: {
    id: number;
    nom: string;
    code: string;
    parentId?: number | null;
  };
  parent?: {
    id: number;
    nom: string;
    code: string;
  } | null;
  province?: {
    id: number;
    nom: string;
    code: string;
  } | null;
  _count?: {
    enfants?: number;
    postes?: number;
    affectations?: number;
  };
  uniteExistanteId?: number | null;
}

export async function GetTypesUnitesOrganisationnelles(): Promise<TypeUniteOrganisationnelleItem[]> {
  const response = await fetch("../api/type-unites-organisationnelles", {
    method: "GET",
    next: { revalidate: 10 },
  });
  const json = await response.json();
  return Array.isArray(json?.data) ? json.data : [];
}

export async function CreateTypeUniteOrganisationnelle(data: Partial<TypeUniteOrganisationnelleItem>) {
  const response = await fetch("../api/type-unites-organisationnelles", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function UpdateTypeUniteOrganisationnelle(data: Partial<TypeUniteOrganisationnelleItem> & { id: number }) {
  const response = await fetch("../api/type-unites-organisationnelles", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function DeleteTypeUniteOrganisationnelle(data: { id: number }) {
  const response = await fetch("../api/type-unites-organisationnelles", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function GetUnitesOrganisationnelles(): Promise<UniteOrganisationnelleItem[]> {
  const response = await fetch("../api/unites-organisationnelles", {
    method: "GET",
    next: { revalidate: 10 },
  });
  const json = await response.json();
  return Array.isArray(json?.data) ? json.data : [];
}

export async function CreateUniteOrganisationnelle(data: Partial<UniteOrganisationnelleItem>) {
  const response = await fetch("../api/unites-organisationnelles", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function UpdateUniteOrganisationnelle(data: Partial<UniteOrganisationnelleItem> & { id: number }) {
  const response = await fetch("../api/unites-organisationnelles", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function DeleteUniteOrganisationnelle(data: { id: number }) {
  const response = await fetch("../api/unites-organisationnelles", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}
