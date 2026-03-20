"use client";

import CoquillePageTableauBord from "@/components/dashboard/commun/CoquillePageTableauBord";
import GestionCarriere from "@/components/dashboard/carrieres/composant";

export default function Page() {
  return (
    <CoquillePageTableauBord>
      <GestionCarriere />
    </CoquillePageTableauBord>
  );
}

