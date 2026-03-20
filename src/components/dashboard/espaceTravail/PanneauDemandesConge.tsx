"use client";

import { useAuth } from "@/app/contexts/auth/context";
import { hasAnyPermission } from "@/security/permissions";

import VueEnsembleDemandesConge from "@/components/dashboard/conges/VueEnsembleDemandesConge";
import VueDemandesCongePersonnelles from "@/components/dashboard/conges/VueDemandesCongePersonnelles";
import RevueDemandesCongeUnite from "@/components/dashboard/conges/RevueDemandesCongeUnite";
import RevueValidationDemandesConge from "@/components/dashboard/conges/RevueValidationDemandesConge";

export default function PanneauDemandesConge() {
  const { auth }: any = useAuth();

  // Like presence, leave screens are ordered from the strongest workflow permission to the personal view.
  if (hasAnyPermission(auth, ["demande_conge.validate"])) {
    return <RevueValidationDemandesConge />;
  }

  if (hasAnyPermission(auth, ["demande_conge.confirm"])) {
    return <RevueDemandesCongeUnite />;
  }

  if (hasAnyPermission(auth, ["demande_conge.request", "demande_conge.update", "demande_conge.delete"])) {
    return <VueDemandesCongePersonnelles />;
  }

  return <VueEnsembleDemandesConge />;
}

