"use client";
import { AgentsData, DataTables } from "@/utilities/data";
import Charts from "./charts/component";
// import Statistiques from "./statistique/component";
import { DataTable } from "./tables/tableUser";
import { JSX, useEffect, useState } from "react";
import { SectionCards } from "./cards/sectionCard";
import { GetAgent } from "@/app/action/agent/getAgent/action";
import { StatAgent } from "@/app/action/agent/action";
import { App } from "./tables/tabMenuUser";
import { useGet } from "@/hooks/useApi";
import { useDashboard } from "@/app/contexts/dashbords/context";
import ChefServiceDashboardUltra from "../chefServiceDashBoard/composant";
import RHDashboard from "../RH/ressourcesHumaines/component";
import AdminDashboard from "../AdminDashboard/composant";
import GestionFormationDashboard from "../gestionDeFormation/composant";
import { AgentDashboard } from "../agent/agentDashboard";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/app/contexts/auth/context";
import { useRouter } from "next/navigation";
import { GetRole } from "@/app/action/role/action";
import { Tabs, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { TabsContent } from "@/components/ui/tabs";
import { useAgents } from "@/app/contexts/agents/context";
export type Agent = {
  id: number;
  login: string;
  actif: boolean;
  roles: string[];
  compteAgent: {};
};
export default function Tabord() {
  return (
    <>
    {/* <AdminDashboard/> */}
      {/* HEADER */}
      
    </>
  );
}