"use client";

import CoquillePageTableauBord from "@/components/dashboard/commun/CoquillePageTableauBord";
import TableauBordEspaceTravail from "@/components/dashboard/espaceTravail/TableauBordEspaceTravail";

export default function Page() {
  return (
    <CoquillePageTableauBord>
      <TableauBordEspaceTravail />
    </CoquillePageTableauBord>
  );
}

