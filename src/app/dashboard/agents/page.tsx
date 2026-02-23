"use client"
import AgentDashboard from "@/components/dashboard/agent/create/component";
import GestionPresenceAbsenceRich from "@/components/dashboard/AbscencePresence/composant";
import GestionCarriere from "@/components/dashboard/carrieres/composant";
import PaieAvantagesDashboard from "@/components/dashboard/paie/composant";
import OrganisationDashboard from "@/components/dashboard/organisation/composant";
import ReportingDashboard from "@/components/dashboard/reporting/composant";
import AdminDashboard from "@/components/dashboard/AdminDashboard/composant";
import ChefServiceDashboard from "@/components/dashboard/chefServiceDashBoard/composant";
import ChefServiceDashboardUltra from "@/components/dashboard/chefServiceDashBoard/composant";
import GestionFormationDashboard from "@/components/dashboard/gestionDeFormation/composant";
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
   if (isPending || !auth) {
      return <DashLoad />;
    }
    // useEffect(() => {
    //   if (!isPending && !auth && auth==undefined || auth==null) {
    //     Router.push("/");
    //   }
    // }, [auth, isPending, Router]);
   
  return (
    <>
     <AgentDashboard/>
     {/* <GestionFormationDashboard/> */}
    </>
  )
}