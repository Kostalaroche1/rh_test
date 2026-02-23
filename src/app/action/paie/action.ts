export async function createPaie(data: any) {
  const res = await fetch(`../api/paie`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })

  const resp = await res.json()
  return resp
}

export async function getPaies() {
  const res = await fetch(`../api/paie`, {
    cache: "no-store"
  })

  return res.json()
}

export async function updatePaie(data: any) {
  const res = await fetch(`../api/paie`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })

  return res.json()
}

export async function deletePaie(id: string) {
  const res = await fetch(`../api/paie`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  })

  return res.json()
}
