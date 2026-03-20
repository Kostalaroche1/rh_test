"use client";

import CoquillePageTableauBord from "@/components/dashboard/commun/CoquillePageTableauBord";
import PaieAvantagesDashboard from "@/components/dashboard/paie/composant";

export default function Page() {
  return (
    <CoquillePageTableauBord>
      <PaieAvantagesDashboard />
    </CoquillePageTableauBord>
  );
}

