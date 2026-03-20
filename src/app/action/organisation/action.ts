/* =========================
   TYPES COMMUNS
========================= */

export interface ApiResponse<T> {
  data: T
}

/* =========================
   POSTE
========================= */

export interface Poste {
  id: string
  code: string
  libelle: string
  uniteOrganisationnelleId: string
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
    await fetch(`../api/postes`, {
      method: 'DELETE',
      body: JSON.stringify({ id })
    })
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
) {
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
    await fetch(`../api/fonctions`, {
      method: 'DELETE',
      body: JSON.stringify({ id })
    })
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

export async function DeleteGrade(payload: any): Promise<void> {
  try {
    await fetch(`../api/grades`, { method: 'DELETE', body: JSON.stringify(payload) })
  } catch (error) {
    console.error("DeleteGrade error:", error)
  }
}
