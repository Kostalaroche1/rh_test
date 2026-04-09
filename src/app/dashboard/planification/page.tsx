"use client";

import CoquillePageTableauBord from "@/components/dashboard/commun/CoquillePageTableauBord";
import PageGestionPlanification from "@/components/dashboard/planification/PageGestionPlanification";

export default function Page() {
  return (
    <CoquillePageTableauBord>
      <PageGestionPlanification />
    </CoquillePageTableauBord>
  );
}
