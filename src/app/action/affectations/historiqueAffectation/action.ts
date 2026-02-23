/* =========================
   TYPES
========================= */

export interface ApiResponse<T> {
  data: T
}

export interface HistoriqueAffectation {
  id: string
  affectationId: string
  dateChangement: string
  ancienPoste?: string | null
  nouveauPoste?: string | null
  ancienGrade?: string | null
  nouveauGrade?: string | null
  motif: string
}

/* =========================
   ACTIONS
========================= */

// 🔹 Toutes les entrées
export async function GetHistoriquesAffectation(): Promise<HistoriqueAffectation[]> {
  try {
    const res = await fetch('/api/historiques-affectation')
    const json: ApiResponse<HistoriqueAffectation[]> = await res.json()
    return json.data
  } catch (error) {
    console.error("GetHistoriquesAffectation error:", error)
    return []
  }
}

// 🔹 Par affectation
export async function GetHistoriqueByAffectation(
  affectationId: string
): Promise<HistoriqueAffectation[]> {
  try {
    const res = await fetch(`/api/historiques-affectation?affectationId=${affectationId}`)
    const json: ApiResponse<HistoriqueAffectation[]> = await res.json()
    return json.data
  } catch (error) {
    console.error("GetHistoriqueByAffectation error:", error)
    return []
  }
}

// 🔹 Créer une entrée d’historique
export async function CreateHistoriqueAffectation(
  payload: Omit<HistoriqueAffectation, "id" | "dateChangement">
): Promise<HistoriqueAffectation | null> {
  try {
    const res = await fetch('/api/historiques-affectation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json: ApiResponse<HistoriqueAffectation> = await res.json()
    return json.data
  } catch (error) {
    console.error("CreateHistoriqueAffectation error:", error)
    return null
  }
}

// 🔹 Supprimer (rare mais utile)
export async function DeleteHistoriqueAffectation(id: string): Promise<boolean> {
  try {
    await fetch(`/api/historiques-affectation/${id}`, {
      method: 'DELETE',
    })
    return true
  } catch (error) {
    console.error("DeleteHistoriqueAffectation error:", error)
    return false
  }
}
