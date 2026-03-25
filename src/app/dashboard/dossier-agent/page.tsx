"use client";

import CoquillePageTableauBord from "@/components/dashboard/commun/CoquillePageTableauBord";
import DossierAgentDashboard from "@/components/dashboard/dossierAgent/composant";

export default function Page() {
  return (
    <CoquillePageTableauBord>
      <DossierAgentDashboard />
    </CoquillePageTableauBord>
  );
}
