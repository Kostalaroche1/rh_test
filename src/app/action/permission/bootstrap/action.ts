export async function BootstrapPermissions(_: void = undefined) {
  const response = await fetch("/api/agent/permission/bootstrap", {
    method: "POST",
    headers: { "content-type": "application/json" },
  });

  return response.json();
}

