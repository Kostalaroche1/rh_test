"use client";

import Tabord from "@/components/dashboard/tabord/tabord";
import { useEffect } from "react";
import { useAuth } from "../contexts/auth/context";
import { useRouter } from "next/navigation";
import { DashLoading } from "@/components/chargement/dashLoading";
import { useDashboard } from "../contexts/dashbords/context";
import { Separator } from "@radix-ui/react-separator";
import AdminDashboard from "@/components/dashboard/AdminDashboard/composant";
import ChefServiceDashboardUltra from "@/components/dashboard/chefServiceDashBoard/composant";
import RHDashboard from "@/components/dashboard/RH/ressourcesHumaines/component";
import { DashLoad } from "@/components/chargement/dashLoad";
import AgentDashboard from "@/components/dashboard/agent/create/component";

export default function Page() {
  const { auth, isPending }: any = useAuth();
  const Router = useRouter();

  //  const { currentRole } = useDashboard();
  // if (!currentRole) return <div>Chargement...</div>;
  // if (isPending) return;
  

  useEffect(() => {
    if(isPending) return ;

  if (!auth) {
    Router.replace("/");
  }
}, [auth, isPending, Router]);



 if(isPending) return <DashLoad />;

if (!auth) return null; // évite flash

const userRole = auth.role.find((rol: { roleId: any; }) => rol.roleId == rol.roleId).roleId

return (
  <div className="erp-page">
    <div className="flex flex-col gap-1">
      <Separator />

      {userRole === 1 && <AgentDashboard />}
      {userRole === 1 && <AdminDashboard />}
      {userRole === 1 && <ChefServiceDashboardUltra />}
      {userRole === 1 && <RHDashboard />}
    </div>
  </div>
);
}
