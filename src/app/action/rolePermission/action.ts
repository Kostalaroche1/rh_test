export async function GetRolePermissions() {
  const response = await fetch("/api/agent/role-permission", {
    method: "GET",
    next: { revalidate: 10 },
  });

  return response.json();
}

export async function UpdateRolePermissions(data: {
  roleId: number;
  permissionIds: number[];
  portees?: Record<string, string>;
}) {
  const response = await fetch("/api/agent/role-permission", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  });

  return response.json();
}

