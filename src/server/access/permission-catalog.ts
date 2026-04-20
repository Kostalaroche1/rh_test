const CRUD_ACTIONS = ["read", "create", "update", "delete"] as const;

const CRUD_RESOURCES = [
  "role",
  "permission",
  "user",
  "agent",
  "province",
  "type_planification",
  "planification",
  "type_conge",
  "paie",
  "horaire_travail",
  "poste",
  "fonction",
  "grade",
  "notification",
  "rapport",
  "polyclinique_demande",
  "polyclinique_dossier",
  "type_unite_organisationnelle",
  "unite_organisationnelle",
  "regle_portee_role",
] as const;

const EXTRA_PERMISSIONS = [
  "agent_dossier.read",
  "presence.read",
  "presence.update",
  "presence.delete",
  "presence.sign",
  "presence.biometric",
  "presence.confirm",
  "presence.validate",
  "demande_conge.read",
  "demande_conge.update",
  "demande_conge.delete",
  "demande_conge.confirm",
  "demande_conge.validate",
  "demande_conge.request",
  "paie.publish",
  "affectation.assign",
  "horaire_agent.assign",
  "planification.assign",
  "planification.validate",
  "polyclinique.access",
  "polyclinique_demande.request",
  "polyclinique_demande.validate",
] as const;

export const DEFAULT_PERMISSION_CODES = [
  ...CRUD_RESOURCES.flatMap((resource) =>
    CRUD_ACTIONS.map((action) => `${resource}.${action}`)
  ),
  "affectation.read",
  "affectation.update",
  "affectation.delete",
  "horaire_agent.read",
  "horaire_agent.update",
  "horaire_agent.delete",
  ...EXTRA_PERMISSIONS,
].sort();
