"use client"
import GestionPresenceAbsenceRich from "@/components/dashboard/AbscencePresence/composant";
import { useAuth } from "@/app/contexts/auth/context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DashLoad } from "@/components/chargement/dashLoad";


export default function Page() {
    const { auth, isPending } : any = useAuth();
    const Router = useRouter();
  
      //  const { currentRole } = useDashboard();
      // if (!currentRole) return <div>Chargement...</div>;
   if (isPending || !auth) {
      return <DashLoad />;
    }
    useEffect(() => {
      if (!isPending && !auth && auth==undefined || auth==null) {
        Router.push("/");
      }
    }, [auth, isPending, Router]);
   
  return (
    <>
     {/* <AgentDashboard/> */}
     <GestionPresenceAbsenceRich/>
    </>
  )
}