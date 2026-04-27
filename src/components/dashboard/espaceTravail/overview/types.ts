import type { LucideIcon } from "lucide-react";

export type ModuleCard = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  permissions: string[];
};

export type OrganisationType = {
  id: number;
  code: string;
  nom: string;
  description?: string | null;
  parentId?: number | null;
  ordre?: number | null;
  actif?: boolean;
  systeme?: boolean;
  typeOrgaUniteProvinces?: Array<{
    id: number;
    provinceId: number;
    uniteOrganisationnelleId?: number | null;
    actif: boolean;
  }>;
};

export type DirectionItem = {
  id: number;
  code: string;
  nom: string;
  parentId?: number | null;
  niveau?: number | null;
};

export type ProvinceSummary = {
  id: number;
  code: string;
  nom: string;
  _count?: {
    unites?: number;
    affectations?: number;
  };
  unites?: DirectionItem[];
  links?: Array<{
    id: number;
    typeUniteId: number;
    typeUnite?: {
      id: number;
      code: string;
      nom: string;
      parentId?: number | null;
    } | null;
    uniteOrganisationnelleId?: number | null;
    uniteOrganisationnelle?: DirectionItem | null;
    _count?: {
      affectations?: number;
    };
  }>;
};

export type AffectationSummary = {
  id?: number;
  dateDebut?: string | Date | null;
  dateFin?: string | Date | null;
  principale?: boolean;
  actif?: boolean;
  statutOrganisationnel?: string | null;
  typeOrgaUniteProvince?: {
    typeUnite?: {
      id: number;
      nom: string;
      code: string;
      parentId?: number | null;
    } | null;
    province?: {
      id: number;
      nom: string;
      code: string;
    } | null;
    uniteOrganisationnelle?: DirectionItem | null;
  } | null;
};

export type AgentPresenceItem = {
  date?: string | Date | null;
  heureArrivee?: string | Date | null;
  statut?: string | null;
};

export type AgentCongeItem = {
  statut?: string | null;
  dateDemande?: string | Date | null;
  dateDebut?: string | Date | null;
  dateFin?: string | Date | null;
};

export type AgentDashboardItem = {
  id: number;
  matricule?: string | null;
  nom?: string;
  prenom?: string;
  genre?: string | null;
  photo?: string | null;
  datenais?: string | Date | null;
  actif?: boolean;
  affectations?: AffectationSummary[];
  presences?: AgentPresenceItem[];
  demandeConge?: AgentCongeItem[];
};

export type OrganisationMapping = {
  id: number;
  typeUniteId: number;
  typeUnite?: {
    id: number;
    code: string;
    nom: string;
    parentId?: number | null;
  } | null;
  uniteOrganisationnelleId?: number | null;
  uniteOrganisationnelle?: DirectionItem | null;
  _count?: {
    affectations?: number;
  };
  provinceId?: number | null;
  province?: {
    id: number;
    code: string;
    nom: string;
  } | null;
};

export type DashAdminPayload = {
  absences?: number;
  presences?: number;
  demandeconges?: number;
  actif?: number;
  organisation?: {
    affectation?: number;
    typesUnites?: number;
    stations?: number;
    unites?: number;
    directions?: number;
    types?: OrganisationType[];
    provinces?: ProvinceSummary[];
    mappings?: OrganisationMapping[];
  };
  scope?: {
    hasGlobalProvinceAccess?: boolean;
  };
  AgentsPresences?: AgentDashboardItem[];
  connectedAgent?: AgentDashboardItem | null;
};

export type PieDatum = {
  key: string;
  label: string;
  value: number;
};

export type GenderBucket = "HOMME" | "FEMME" | "AUTRE";

export type GenderSplit = {
  key: string;
  label: string;
  male: number;
  female: number;
  other: number;
  total: number;
};

export type TrendPoint = {
  month: string;
  [key: string]: string | number;
};

export type DirectionTreeNode = DirectionItem & {
  children: DirectionTreeNode[];
};

export type OverviewAnalytics = {
  filteredAgents: AgentDashboardItem[];
  scopedStationsCount: number;
  scopedDirectionsCount: number;
  activeAffectationsCount: number;
  agentsByDirection: PieDatum[];
  agentsByStation: PieDatum[];
  agentsByProvince: PieDatum[];
  affectationsByDirection: PieDatum[];
  affectationsByStation: PieDatum[];
  affectationsByProvince: PieDatum[];
  affectationsBySex: PieDatum[];
  presencesByProvince: PieDatum[];
  presencesByStation: PieDatum[];
  presencesByDirection: PieDatum[];
  presencesBySousDirection: PieDatum[];
  presencesByBureau: PieDatum[];
  congesByProvince: PieDatum[];
  congesByStation: PieDatum[];
  congesByDirection: PieDatum[];
  congesBySousDirection: PieDatum[];
  congesByBureau: PieDatum[];
  congesBySex: PieDatum[];
  retraitesByProvince: PieDatum[];
  retraitesByStation: PieDatum[];
  retraitesByDirection: PieDatum[];
  retraitesBySousDirection: PieDatum[];
  retraitesByBureau: PieDatum[];
  retraitesBySex: PieDatum[];
  presenceCountByDirectionId: Map<number, number>;
  congeCountByDirectionId: Map<number, number>;
  sexByDirection: GenderSplit[];
  sexByStation: GenderSplit[];
  sexByProvinceAndStation: GenderSplit[];
  directionTreeByTypeId: Map<number, DirectionTreeNode[]>;
};
