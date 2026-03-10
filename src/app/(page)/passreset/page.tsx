"use client";

import { useAuth } from "@/app/contexts/auth/context";
import { PasswordReset } from "@/components/password-reset/passreset";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PasswordResetPage() {
  const { auth } = useAuth() as { auth?: unknown };
  const router = useRouter();

  useEffect(() => {
    if (auth) {
      router.push("/dashboard");
    }
  }, [auth, router]);

  return (
    <div className="relative grid min-h-svh place-items-center p-4 md:p-8 motion-safe:animate-in motion-safe:fade-in-0">
      <div className="erp-panel w-full max-w-md rounded-3xl p-6 md:p-8 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-3">
        <PasswordReset />
      </div>
    </div>
  );
}
