"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/app/contexts/auth/context";
import { DashLoad } from "@/components/chargement/dashLoad";

export default function CoquillePageTableauBord({ children }: { children: ReactNode }) {
  const { auth, isPending }: any = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;
    if (!auth) {
      router.replace("/");
    }
  }, [auth, isPending, router]);

  if (isPending || !auth) {
    return <DashLoad />;
  }

  return <>{children}</>;
}

