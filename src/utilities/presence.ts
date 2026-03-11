export type PresenceDisplayStatus =
  | "PRESENT"
  | "RETARD"
  | "ABSENT"
  | "CONGE"
  | "MISSION"
  | "MALADIE"
  | "OFF";

const LATE_HOUR = 8;
const LATE_MINUTE = 30;

export function isLateArrival(heureArrivee?: string | Date | null): boolean {
  if (!heureArrivee) return false;
  const arrivee = new Date(heureArrivee);
  if (Number.isNaN(arrivee.getTime())) return false;

  const limite = new Date(arrivee);
  limite.setHours(LATE_HOUR, LATE_MINUTE, 0, 0);

  return arrivee > limite;
}

export function computePresenceStatus(input: {
  statut?: string | null;
  heureArrivee?: string | Date | null;
}): PresenceDisplayStatus {
  const statut = (input.statut ?? "").toUpperCase();

  if (
    statut === "ABSENT" ||
    statut === "CONGE" ||
    statut === "MISSION" ||
    statut === "MALADIE" ||
    statut === "OFF" ||
    statut === "RETARD"
  ) {
    return statut as PresenceDisplayStatus;
  }

  if (statut === "PRESENCE" || statut === "CONFIRME" || statut === "VALIDE" || statut === "BROUILLON") {
    return input.heureArrivee && isLateArrival(input.heureArrivee) ? "RETARD" : "PRESENT";
  }

  if (!input.heureArrivee) {
    return "ABSENT";
  }

  return isLateArrival(input.heureArrivee) ? "RETARD" : "PRESENT";
}
