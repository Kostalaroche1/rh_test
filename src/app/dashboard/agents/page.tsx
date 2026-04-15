"use client";

import CoquillePageTableauBord from "@/components/dashboard/commun/CoquillePageTableauBord";
import { DataTable } from "@/components/dashboard/tabord/tables/tableUser";
import EspaceEmployes from "@/components/dashboard/espaceTravail/EspaceEmployes";
import TableauBordEspaceTravail from "@/components/dashboard/espaceTravail/TableauBordEspaceTravail";
import { useAgents } from "@/app/contexts/agents/context";
import { useAuth } from "@/app/contexts/auth/context";
import { hasAnyPermission } from "@/security/permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Page() {
  const { auth }: any = useAuth();
  const { agents, isPendingAgents, refetchAgents } = useAgents();

  const canManageAgentsWorkspace = hasAnyPermission(auth, [
    "agent.read",
    "agent.create",
    "agent.update",
    "user.read",
    "user.create",
    "user.update",
    "horaire_travail.read",
    "horaire_travail.create",
    "horaire_travail.update",
    "horaire_travail.delete",
    "horaire_agent.read",
    "horaire_agent.assign",
    "horaire_agent.update",
    "horaire_agent.delete",
    "role.read",
    "permission.read",
  ]);

  return (
    <CoquillePageTableauBord>
      {canManageAgentsWorkspace ? (
        <Tabs defaultValue="gestion" className="w-full">
          <TabsList className="mb-4">
            {/* <TabsTrigger value="dashboard">Dashboard</TabsTrigger> */}
            <TabsTrigger value="gestion">Gestion agents</TabsTrigger>
          </TabsList>
          {/* <TabsContent value="dashboard">
            <TableauBordEspaceTravail />
          </TabsContent> */}
          <TabsContent value="gestion">
            <DataTable
              data={Array.isArray(agents) ? agents : []}
              isPending={Boolean(isPendingAgents)}
              onRefresh={refetchAgents}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <EspaceEmployes />
      )}
    </CoquillePageTableauBord>
  );
}

