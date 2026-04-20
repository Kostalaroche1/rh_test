import {
  Building2,
  CalendarDays,
  ClipboardCheck,
  Hospital,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import type { ModuleCard } from "./types";

export const MODULES: ModuleCard[] = [
  {
    title: "Agents",
    description: "Comptes, dossiers agents et parcours.",
    href: "/dashboard/agents",
    icon: Users,
    permissions: ["agent.read", "user.read"],
  },
  {
    title: "Organisation",
    description: "Stations, directions, postes, fonctions, grades et affectations.",
    href: "/dashboard/organisation",
    icon: Building2,
    permissions: [
      "province.read",
      "type_unite_organisationnelle.read",
      "unite_organisationnelle.read",
      "poste.read",
      "fonction.read",
      "grade.read",
      "affectation.read",
    ],
  },
  {
    title: "Presences & Absences",
    description: "Pointage, confirmation, validation et suivi des absences.",
    href: "/dashboard/presenceAbsence",
    icon: ClipboardCheck,
    permissions: [
      "presence.read",
      "presence.sign",
      "presence.biometric",
      "presence.confirm",
      "presence.validate",
    ],
  },
  {
    title: "Conges",
    description: "Types de conge et demandes selon vos permissions.",
    href: "/dashboard/conges",
    icon: CalendarDays,
    permissions: ["demande_conge.read", "demande_conge.request", "type_conge.read"],
  },
  {
    title: "Carrieres",
    description: "Decisions et suivi des affectations.",
    href: "/dashboard/carrieres",
    icon: TrendingUp,
    permissions: ["affectation.read", "agent.read"],
  },
  {
    title: "Paie",
    description: "Bulletins, paiements et avantages.",
    href: "/dashboard/paie",
    icon: Wallet,
    permissions: ["paie.read"],
  },
  {
    title: "Polyclinique",
    description: "Demandes de soin, validation RH et dossiers medicaux.",
    href: "/dashboard/polyclinique",
    icon: Hospital,
    permissions: [
      "polyclinique.access",
      "polyclinique_demande.read",
      "polyclinique_demande.request",
      "polyclinique_demande.validate",
      "polyclinique_dossier.read",
      "polyclinique_dossier.create",
    ],
  },
  {
    title: "Controle d'acces",
    description: "Roles, permissions et portees.",
    href: "/dashboard/access",
    icon: ShieldCheck,
    permissions: ["role.read", "permission.read"],
  },
];

export const MONTH_LABELS = ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"];
export const YEAR_COLORS = ["#005dc3", "#00a3a3", "#d73242", "#f59e0b"];
export const PIE_COLORS = [
  "#005dc3",
  "#00a3a3",
  "#f59e0b",
  "#d73242",
  "#2f855a",
  "#8b5cf6",
  "#0ea5e9",
  "#ef4444",
  "#16a34a",
  "#6b7280",
];

export const GENDER_COLORS = {
  HOMME: "#005dc3",
  FEMME: "#d73242",
  AUTRE: "#6b7280",
};
