
"use client"
import OrganisationDashboard from "@/components/dashboard/organisation/composant";
import ReportingDashboard from "@/components/dashboard/reporting/composant";
import AdminDashboard from "@/components/dashboard/AdminDashboard/composant";
import ChefServiceDashboard from "@/components/dashboard/chefServiceDashBoard/composant";
import ChefServiceDashboardUltra from "@/components/dashboard/chefServiceDashBoard/composant";
import GestionFormationDashboard from "@/components/dashboard/gestionDeFormation/composant";
import { CongeAgents } from "@/components/dashboard/agent/conges/conges";
import GestionPresenceAbsenceRich from "@/components/dashboard/AbscencePresence/composant";
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
     <GestionPresenceAbsenceRich/>
    </>
  )
}