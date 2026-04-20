import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/security/auth";
import { markUserOffline, touchUserSession } from "@/server/session-presence";

export async function POST(req: Request) {
  const auth = await getAuthenticatedUser();
  if (!auth) {
    return NextResponse.json({ message: "Non autorise" }, { status: 401 });
  }

  let offline = false;

  try {
    const rawBody = await req.text();
    if (rawBody.trim()) {
      const parsed = JSON.parse(rawBody) as { offline?: boolean };
      offline = Boolean(parsed?.offline);
    }
  } catch {
    offline = false;
  }

  if (offline) {
    markUserOffline(auth.userId);
    return NextResponse.json({ status: "offline" }, { status: 200 });
  }

  touchUserSession(auth.userId);
  return NextResponse.json({ status: "online" }, { status: 200 });
}

