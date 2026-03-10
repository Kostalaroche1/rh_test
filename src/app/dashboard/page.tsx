"use client";

import { useEffect, useMemo } from "react";
import { useAuth } from "../contexts/auth/context";
import { useRouter } from "next/navigation";

import AdminDashboard from "@/components/dashboard/AdminDashboard/composant";
import ChefServiceDashboardUltra from "@/components/dashboard/chefServiceDashBoard/composant";
import RHDashboard from "@/components/dashboard/RH/ressourcesHumaines/component";
import AgentDashboard from "@/components/dashboard/agent/create/component";
import { DashLoad } from "@/components/chargement/dashLoad";
import { Separator } from "@radix-ui/react-separator";

function extractRoleKey(auth: any) {
  const roles = Array.isArray(auth?.role) ? auth.role : [];
  const activeRole = [...roles].reverse().find((item: any) => item?.role?.actif ?? true);
  return (activeRole?.role?.key ?? "").toLowerCase();
}

export default function Page() {
  const { auth, isPending } = useAuth() as { auth?: any; isPending: boolean };
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;
    if (!auth) {
      router.replace("/");
    }
  }, [auth, isPending, router]);

  const roleKey = useMemo(() => extractRoleKey(auth), [auth]);

  if (isPending) return <DashLoad />;
  if (!auth) return null;

  return (
    <div className="erp-page">
      <div className="flex flex-col gap-1">
        <Separator />
        {roleKey === "admin" && <AdminDashboard />}
        {roleKey === "rh" && <RHDashboard />}
        {roleKey === "chefservice" && <ChefServiceDashboardUltra />}
        {!["admin", "rh", "chefservice"].includes(roleKey) && <AgentDashboard />}
      </div>
    </div>
  );
}

