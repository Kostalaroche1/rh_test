"use client";

import { useAuth } from "@/app/contexts/auth/context";
import { hasAnyPermission } from "@/security/permissions";

import VueEnsemblePresences from "@/components/dashboard/presences/VueEnsemblePresences";
import VuePresencePersonnelle from "@/components/dashboard/presences/VuePresencePersonnelle";
import RevuePresencesUnite from "@/components/dashboard/presences/RevuePresencesUnite";
import RevueValidationPresences from "@/components/dashboard/presences/RevueValidationPresences";

export default function PanneauPresences() {
  const { auth }: any = useAuth();

  // Show the highest-responsibility presence view first so one user with multiple permissions lands
  // on the review screen that matches their strongest workflow role.
  if (hasAnyPermission(auth, ["presence.validate"])) {
    return <RevueValidationPresences />;
  }

  if (hasAnyPermission(auth, ["presence.confirm"])) {
    return <RevuePresencesUnite />;
  }

  if (hasAnyPermission(auth, ["presence.read"])) {
    return <VueEnsemblePresences />;
  }

  return <VuePresencePersonnelle />;
}

