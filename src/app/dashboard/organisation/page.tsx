"use client"
import AgentDashboard from "@/components/dashboard/agent/create/component";
import GestionPresenceAbsenceRich from "@/components/dashboard/AbscencePresence/composant";
import GestionCarriere from "@/components/dashboard/carrieres/composant";
import OrganisationDashboard from "@/components/dashboard/organisation/composant";
import { useAuth } from "@/app/contexts/auth/context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DashLoading } from "@/components/chargement/dashLoading";
import { DashLoad } from "@/components/chargement/dashLoad";


export default function Page() {
    const { auth, isPending } : any = useAuth();
    const Router = useRouter();
  
      //  const { currentRole } = useDashboard();
      // if (!currentRole) return <div>Chargement...</div>;
  
    useEffect(() => {
       if (isPending) return;
      if (!auth) {
        Router.push("/");
      }
    }, [auth, isPending, Router]);
    if (isPending) {
      return <DashLoad />;
    }
  return (
    <>
     {/* <AgentDashboard/> */}
     <OrganisationDashboard/>
    </>
  )
}