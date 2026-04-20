import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/security/auth";
import { markUserOffline } from "@/server/session-presence";

export async function POST() {
  const auth = await getAuthenticatedUser();
  if (auth?.userId) {
    markUserOffline(auth.userId);
  }

  const response = NextResponse.json({ message: "Deconnecte" });
  response.cookies.delete("auth_token");
  return response;
}

