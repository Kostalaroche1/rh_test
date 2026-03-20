"use client";

import CoquillePageTableauBord from "@/components/dashboard/commun/CoquillePageTableauBord";
import GestionPresenceAbsenceRich from "@/components/dashboard/AbscencePresence/composant";

export default function Page() {
  return (
    <CoquillePageTableauBord>
      <GestionPresenceAbsenceRich />
    </CoquillePageTableauBord>
  );
}

