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
import { canManageAccessControl, hasAnyPermission } from "@/security/permissions";

function resolveDashboard(auth: any) {
  if (canManageAccessControl(auth)) {
    return "admin";
  }

  if (
    hasAnyPermission(auth, [
      "user.read",
    ])
  ) {
    return "admin";
  }

  if (
    hasAnyPermission(auth, [
      "paie.read",
      "conge.validate",
      "type_conge.read",
      "horaire_travail.read",
    ])
  ) {
    return "rh";
  }

  if (
    hasAnyPermission(auth, [
      "horaire_agent.read",
      "presence.confirm",
      "affectation.read",
    ])
  ) {
    return "chefservice";
  }

  return "agent";
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

  const dashboardKey = useMemo(() => resolveDashboard(auth), [auth]);

  if (isPending) return <DashLoad />;
  if (!auth) return null;

  return (
    <div className="erp-page">
      <div className="flex flex-col gap-1">
        <Separator />
        {dashboardKey === "admin" && <AdminDashboard />}
        {dashboardKey === "rh" && <RHDashboard />}
        {dashboardKey === "chefservice" && <ChefServiceDashboardUltra />}
        {dashboardKey === "agent" && <AgentDashboard />}
      </div>
    </div>
  );
}
