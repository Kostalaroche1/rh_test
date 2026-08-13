export async function GetPermissions() {
  const response = await fetch("/api/agent/permission", {
    method: "GET",
    next: { revalidate: 10 },
  });

  return response.json();
}

export async function AddPermission(data: { code: string }) {
  const response = await fetch("/api/agent/permission", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });

  return response.json();
}

