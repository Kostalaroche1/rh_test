const CRUD_ACTIONS = ["read", "create", "update", "delete"] as const;

const CRUD_RESOURCES = [
  "role",
  "permission",
  "user",
  "agent",
  "presence",
  "conge",
  "type_conge",
  "paie",
  "horaire_travail",
  "horaire_agent",
  "affectation",
  "direction",
  "departement",
  "site",
  "poste",
  "fonction",
  "grade",
  "notification",
  "rapport",
] as const;

const EXTRA_PERMISSIONS = [
  "presence.sign",
  "presence.signal_absence",
  "presence.confirm",
  "presence.validate",
  "conge.confirm",
  "conge.validate",
  "conge.request",
  "paie.publish",
  "affectation.assign",
  "horaire_agent.assign",
] as const;

export const DEFAULT_PERMISSION_CODES = [
  ...CRUD_RESOURCES.flatMap((resource) =>
    CRUD_ACTIONS.map((action) => `${resource}.${action}`)
  ),
  ...EXTRA_PERMISSIONS,
].sort();
