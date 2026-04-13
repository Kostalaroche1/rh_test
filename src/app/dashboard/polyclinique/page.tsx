"use client";

import CoquillePageTableauBord from "@/components/dashboard/commun/CoquillePageTableauBord";
import PolycliniqueDashboard from "@/components/dashboard/polyclinique/PolycliniqueDashboard";

export default function Page() {
  return (
    <CoquillePageTableauBord>
      <PolycliniqueDashboard />
    </CoquillePageTableauBord>
  );
}
