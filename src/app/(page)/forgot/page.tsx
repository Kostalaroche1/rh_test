"use client";

import { useAuth } from "@/app/contexts/auth/context";
import { ForgotPassword } from "@/components/forgot-password/forgot";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ForgotPage() {
  const { auth }: any = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth) {
      router.push("/dashboard");
    }
  }, [auth, router]);

  return (
    <div className="relative grid min-h-svh place-items-center p-4 md:p-8">
      <div className="erp-panel w-full max-w-md rounded-3xl p-6 md:p-8">
        <ForgotPassword />
      </div>
    </div>
  );
}
