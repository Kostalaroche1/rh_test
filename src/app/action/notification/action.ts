export async function AddNotification(data: any) {
  try {
    const res = await fetch("/api/notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    return json;
  } catch (error) {
    console.error("Erreur AddNotification:", error);
    throw error;
  }
}

export async function GetNotifications() {
  try {
    const res = await fetch("/api/notification", {
      method: "GET",
    });
    const json = await res.json();
    return json;
  } catch (error) {
    console.error("Erreur GetNotifications:", error);
    throw error;
  }
}

export async function MarkNotificationRead(payload: { id: number; statut?: "LU" | "NON_LU" }) {
  const res = await fetch("/api/notifications", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Failed to mark notification read");
  return res.json();
}

