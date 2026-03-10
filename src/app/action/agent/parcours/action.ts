export async function getAgentParcours(agentId: number) {
  if (!agentId) return null;

  try {
    const res = await fetch(`/api/agent/parcours/${agentId}`, {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch (error) {
    console.error("getAgentParcours failed:", error);
    return null;
  }
}

