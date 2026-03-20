"use client";

import CoquillePageTableauBord from "@/components/dashboard/commun/CoquillePageTableauBord";
import { DataTable } from "@/components/dashboard/tabord/tables/tableUser";
import EspaceEmployes from "@/components/dashboard/espaceTravail/EspaceEmployes";
import { useAgents } from "@/app/contexts/agents/context";
import { useAuth } from "@/app/contexts/auth/context";
import { hasAnyPermission } from "@/security/permissions";

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
        <DataTable
          data={Array.isArray(agents) ? agents : []}
          isPending={Boolean(isPendingAgents)}
          onRefresh={refetchAgents}
        />
      ) : (
        <EspaceEmployes />
      )}
    </CoquillePageTableauBord>
  );
}

