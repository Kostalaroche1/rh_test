"use client";

import { useAuth } from "@/app/contexts/auth/context";
import { LoginForm } from "@/components/login-form";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
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
        <LoginForm />
      </div>
    </div>
  );
}
