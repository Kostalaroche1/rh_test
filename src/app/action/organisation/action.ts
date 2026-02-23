/* =========================
   TYPES COMMUNS
========================= */

export interface ApiResponse<T> {
  data: T
}

/* =========================
   DIRECTION
========================= */

export interface Direction {
  id: string
  code: string
  libelle: string
  description?: string
}

export async function GetDirections(): Promise<Direction[]> {
  try {
    const res = await fetch('../api/directions')
    const json: ApiResponse<Direction[]> = await res.json()
    return json.data
  } catch (error) {
    console.error("GetDirections error:", error)
    return []
  }
}

export async function CreateDirection(
  payload: Omit<Direction, "id">
): Promise<Direction | null> {
  try {
    const res = await fetch('../api/directions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json: ApiResponse<Direction> = await res.json()
    return json.data
  } catch (error) {
    console.error("CreateDirection error:", error)
    return null
  }
}

export async function UpdateDirection(
  payload: any
) {
  try {
    const res = await fetch(`../api/directions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json: ApiResponse<Direction> = await res.json()
    return json.data
  } catch (error) {
    console.error("UpdateDirection error:", error)
    return null
  }
}

export async function DeleteDirection(id: string): Promise<void> {
  try {
    await fetch(`../api/directions/${id}`, { method: 'DELETE' })
  } catch (error) {
    console.error("DeleteDirection error:", error)
  }
}

/* =========================
   DEPARTEMENT
========================= */

export interface Departement {
  id: string
  code: string
  nom: string
  directionId: string
}

export async function GetDepartements(): Promise<Departement[]> {
  try {
    const res = await fetch('../api/departements')
    const json: ApiResponse<Departement[]> = await res.json()
    return json.data
  } catch (error) {
    console.error("GetDepartements error:", error)
    return []
  }
}

export async function CreateDepartement(
  payload: Omit<Departement, "id">
): Promise<Departement | null> {
  try {
    const res = await fetch('../api/departements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json: ApiResponse<Departement> = await res.json()
    return json.data
  } catch (error) {
    console.error("CreateDepartement error:", error)
    return null
  }
}

export async function UpdateDepartement(
  payload: any
){
  try {
    const res = await fetch(`../api/departements`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json: ApiResponse<Departement> = await res.json()
    return json.data
  } catch (error) {
    console.error("UpdateDepartement error:", error)
    return null
  }
}

export async function DeleteDepartement(id: string): Promise<void> {
  try {
    await fetch(`../api/departements/${id}`, { method: 'DELETE' })
  } catch (error) {
    console.error("DeleteDepartement error:", error)
  }
}

/* =========================
   SITE
========================= */

export interface Site {
  id: string
  nom: string
  adresse: string
  ville: string
}

export async function GetSites(): Promise<Site[]> {
  try {
    const res = await fetch('../api/sites')
    const json: ApiResponse<Site[]> = await res.json()
    return json.data
  } catch (error) {
    console.error("GetSites error:", error)
    return []
  }
}

export async function CreateSite(
  payload: Omit<Site, "id">
): Promise<Site | null> {
  try {
    const res = await fetch('../api/sites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json: ApiResponse<Site> = await res.json()
    return json.data
  } catch (error) {
    console.error("CreateSite error:", error)
    return null
  }
}

export async function UpdateSite(
  payload: any
) {
  try {
    const res = await fetch(`../api/sites`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json: ApiResponse<Site> = await res.json()
    return json.data
  } catch (error) {
    console.error("UpdateSite error:", error)
    return null
  }
}

export async function DeleteSite(id: string): Promise<void> {
  try {
    await fetch(`../api/sites/${id}`, { method: 'DELETE' })
  } catch (error) {
    console.error("DeleteSite error:", error)
  }
}

/* =========================
   POSTE
========================= */

export interface Poste {
  id: string
  code: string
  libelle: string
  departementId: string
}

export async function GetPostes(): Promise<Poste[]> {
  try {
    const res = await fetch('../api/postes')
    const json: ApiResponse<Poste[]> = await res.json()
    return json.data
  } catch (error) {
    console.error("GetPostes error:", error)
    return []
  }
}

export async function CreatePoste(
  payload: Omit<Poste, "id">
): Promise<Poste | null> {
  try {
    const res = await fetch('../api/postes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json: ApiResponse<Poste> = await res.json()
    return json.data
  } catch (error) {
    console.error("CreatePoste error:", error)
    return null
  }
}

export async function UpdatePoste(
  payload: any
) {
  try {
    const res = await fetch(`../api/postes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json: ApiResponse<Poste> = await res.json()
    return json.data
  } catch (error) {
    console.error("UpdatePoste error:", error)
    return null
  }
}

export async function DeletePoste(id: string): Promise<void> {
  try {
    await fetch(`../api/postes/${id}`, { method: 'DELETE' })
  } catch (error) {
    console.error("DeletePoste error:", error)
  }
}

/* =========================
   FONCTION
========================= */

export interface Fonction {
  id: string
  code: string
  libelle: string
  posteId?: string | null
}

export async function GetFonctions(): Promise<Fonction[]> {
  try {
    const res = await fetch('../api/fonctions')
    const json: ApiResponse<Fonction[]> = await res.json()
    return json.data
  } catch (error) {
    console.error("GetFonctions error:", error)
    return []
  }
}

export async function CreateFonction(
  payload: Omit<Fonction, "id">
): Promise<Fonction | null> {
  try {
    const res = await fetch('../api/fonctions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json: ApiResponse<Fonction> = await res.json()
    return json.data
  } catch (error) {
    console.error("CreateFonction error:", error)
    return null
  }
}

export async function UpdateFonction(
  payload: any
){
  try {
    const res = await fetch(`../api/fonctions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json: ApiResponse<Fonction> = await res.json()
    return json.data
  } catch (error) {
    console.error("UpdateFonction error:", error)
    return null
  }
}

export async function DeleteFonction(id: string): Promise<void> {
  try {
    await fetch(`../api/fonctions/${id}`, { method: 'DELETE' })
  } catch (error) {
    console.error("DeleteFonction error:", error)
  }
}

/* =========================
   GRADE
========================= */

export interface Grade {
  id: string
  code: string
  libelle: string
  indiceSalarial: number
}

export async function GetGrades(): Promise<Grade[]> {
  try {
    const res = await fetch('../api/grades')
    const json: ApiResponse<Grade[]> = await res.json()
    return json.data
  } catch (error) {
    console.error("GetGrades error:", error)
    return []
  }
}

export async function CreateGrade(
  payload: Omit<Grade, "id">
): Promise<Grade | null> {
  try {
    const res = await fetch('../api/grades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json: ApiResponse<Grade> = await res.json()
    return json.data
  } catch (error) {
    console.error("CreateGrade error:", error)
    return null
  }
}

export async function UpdateGrade(
  payload: any
) {
  try {
    const res = await fetch(`../api/grades`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json: ApiResponse<Grade> = await res.json()
    return json.data
  } catch (error) {
    console.error("UpdateGrade error:", error)
    return null
  }
}

export async function DeleteGrade(payload : any): Promise<void> {
  try {
    await fetch(`../api/grades`, { method: 'DELETE' , body : JSON.stringify(payload)} )
  } catch (error) {
    console.error("DeleteGrade error:", error)
  }
}
