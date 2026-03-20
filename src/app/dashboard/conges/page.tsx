"use client";

import CoquillePageTableauBord from "@/components/dashboard/commun/CoquillePageTableauBord";
import PageGestionConges from "@/components/dashboard/conges/PageGestionConges";

export default function Page() {
  return (
    <CoquillePageTableauBord>
      <PageGestionConges />
    </CoquillePageTableauBord>
  );
}

