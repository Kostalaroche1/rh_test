
export interface Affectation {
  id: string
  agentId: string
  posteId: string
  fonctionId?: string | null
  gradeId: string
  departementId: string
  directionId: string
  siteId: string
  dateDebut: string
  dateFin?: string | null
  motif?: string
  type?: string
}

export async function GetAffectations(): Promise<Affectation[]> {
  try {
    const res = await fetch('../api/affectations')
    const json:any = await res.json()
    return json.data
  } catch (error) {
    console.error("GetAffectations error:", error)
    return []
  }
}

export async function GetAffectationsByAgent(
  agentId: string
): Promise<Affectation[]> {
  try {
    const res = await fetch(`../api/affectations?agentId=${agentId}`)
    const json: any = await res.json()
    return json.data
  } catch (error) {
    console.error("GetAffectationsByAgent error:", error)
    return []
  }
}

export async function CreateAffectation(
  payload: Omit<Affectation, "id">
): Promise<Affectation | null> {
  try {
    const res = await fetch('../api/affectations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json: any = await res.json()
    return json.data
  } catch (error) {
    console.error("CreateAffectation error:", error)
    return null
  }
}

export async function UpdateAffectation(
  payload: any
) {
  try {
    console.log(payload , 'updates ')
    const res = await fetch(`../api/affectations`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json: any = await res.json()
    return json.data
  } catch (error) {
    console.error("UpdateAffectation error:", error)
    return null
  }
}

export async function DeleteAffectation(id: string): Promise<boolean> {
  try {
    const res = await fetch(`../api/affectations`, {
      method: 'DELETE',
      body : JSON.stringify({id : id})
    })
    await res.json()
    return true
  } catch (error) {
    console.error("DeleteAffectation error:", error)
    return false
  }
}
