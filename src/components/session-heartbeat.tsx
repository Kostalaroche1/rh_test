"use client";

import { useEffect } from "react";

import { useAuth } from "@/app/contexts/auth/context";

const HEARTBEAT_INTERVAL_MS = 30_000;

async function postHeartbeat(payload?: { offline?: boolean }) {
  try {
    await fetch("/api/session/heartbeat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload ?? {}),
      keepalive: true,
      cache: "no-store",
    });
  } catch {
    // Silent fail: session heartbeat must not block UI.
  }
}

function sendOfflineBeacon() {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([JSON.stringify({ offline: true })], {
        type: "application/json",
      });
      navigator.sendBeacon("/api/session/heartbeat", blob);
      return;
    }
  } catch {
    // Fallback below.
  }

  void postHeartbeat({ offline: true });
}

export default function SessionHeartbeat() {
  const { auth, isPending } = useAuth() as {
    auth?: { userId?: number } | null;
    isPending?: boolean;
  };

  useEffect(() => {
    if (isPending || !auth?.userId) {
      return;
    }

    void postHeartbeat();

    const timer = window.setInterval(() => {
      void postHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void postHeartbeat();
      }
    };

    const onPageHide = () => {
      sendOfflineBeacon();
    };

    window.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      sendOfflineBeacon();
    };
  }, [auth?.userId, isPending]);

  return null;
}

