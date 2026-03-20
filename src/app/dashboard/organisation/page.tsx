"use client";

import CoquillePageTableauBord from "@/components/dashboard/commun/CoquillePageTableauBord";
import OrganisationDashboard from "@/components/dashboard/organisation/composant";

export default function Page() {
  return (
    <CoquillePageTableauBord>
      <OrganisationDashboard />
    </CoquillePageTableauBord>
  );
}

