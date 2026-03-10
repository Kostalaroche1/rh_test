"use server"

export async function createPrime(data: any) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/prime`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })

  return res.json()
}

export async function updatePrime(data: any) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/prime`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })

  return res.json()
}

export async function deletePrime(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/prime`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  })

  return res.json()
}
