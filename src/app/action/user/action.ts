// import { JsonObject, JsonValue } from "@/generated/prisma/runtime/client";

export async function AddUser(data: any) {
  try {
    const responses = await fetch("../api/utilisateur", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });

    return responses;
  } catch (error) {
    return error;
  }
}

export async function ToggleUserAccountStatus(data: {
  id: number;
  actif: boolean;
}) {
  try {
    const responses = await fetch("../api/utilisateur", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: data.id,
        data: {
          actif: data.actif,
        },
      }),
    });

    const response = await responses.json();

    if (!responses.ok) {
      throw new Error(
        response?.message ?? "Impossible de modifier l'etat du compte"
      );
    }

    return response;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Impossible de modifier l'etat du compte");
  }
}
