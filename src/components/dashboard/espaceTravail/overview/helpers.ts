import type {
  AffectationSummary,
  AgentDashboardItem,
  DashAdminPayload,
  DirectionTreeNode,
  GenderBucket,
  GenderSplit,
  OrganisationType,
  OverviewAnalytics,
  PieDatum,
  TrendPoint,
} from "./types";
import { MONTH_LABELS } from "./constants";

type AssignmentSnapshot = {
  gender: GenderBucket;
  typeId: number | null;
  typeLabel: string;
  directionId: number | null;
  directionLabel: string;
  provinceId: number | null;
  provinceLabel: string;
};

export function toSafeNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("fr-FR").format(toSafeNumber(value));
}

export function parseDateValue(value: unknown) {
  if (!value) return null;
  const date = new Date(value as string | Date);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeGender(value: unknown): GenderBucket {
  const normalized = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

  if (["MASCULIN", "HOMME", "M", "MALE"].includes(normalized)) {
    return "HOMME";
  }

  if (["FEMININ", "FEMININE", "FEMME", "F", "FEMALE"].includes(normalized)) {
    return "FEMME";
  }

  return "AUTRE";
}

function isAffectationActive(affectation: AffectationSummary, now: Date) {
  if (affectation?.actif === false) return false;
  if (String(affectation?.statutOrganisationnel ?? "").toUpperCase() === "TERMINEE") return false;

  const startDate = parseDateValue(affectation?.dateDebut);
  const endDate = parseDateValue(affectation?.dateFin);

  if (startDate && startDate > now) return false;
  if (endDate && endDate < now) return false;

  return true;
}

function sortAffectationsForCurrent(a: AffectationSummary, b: AffectationSummary) {
  const aPrimary = a?.principale ? 1 : 0;
  const bPrimary = b?.principale ? 1 : 0;
  if (aPrimary !== bPrimary) return bPrimary - aPrimary;

  const aStart = parseDateValue(a?.dateDebut)?.getTime() ?? 0;
  const bStart = parseDateValue(b?.dateDebut)?.getTime() ?? 0;
  return bStart - aStart;
}

function buildAssignmentSnapshot(
  affectation: AffectationSummary | null | undefined,
  gender: GenderBucket
): AssignmentSnapshot | null {
  if (!affectation?.typeOrgaUniteProvince) return null;

  const type = affectation.typeOrgaUniteProvince.typeUnite;
  const direction = affectation.typeOrgaUniteProvince.uniteOrganisationnelle;
  const province = affectation.typeOrgaUniteProvince.province;

  return {
    gender,
    typeId: type?.id ?? null,
    typeLabel: type ? `${type.code} - ${type.nom}` : "Sans station",
    directionId: direction?.id ?? null,
    directionLabel: direction ? `${direction.code} - ${direction.nom}` : "Sans direction",
    provinceId: province?.id ?? null,
    provinceLabel: province ? `${province.code} - ${province.nom}` : "Sans province",
  };
}

function incrementMap(map: Map<string, { key: string; label: string; value: number }>, key: string, label: string, amount = 1) {
  const existing = map.get(key);
  if (existing) {
    existing.value += amount;
    return;
  }
  map.set(key, { key, label, value: amount });
}

function mapToSortedPieData(map: Map<string, { key: string; label: string; value: number }>, limit = 8): PieDatum[] {
  return [...map.values()]
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function buildGenderSplit(entries: Array<{ key: string; label: string; gender: GenderBucket }>): GenderSplit[] {
  const bucket = new Map<string, GenderSplit>();
  for (const entry of entries) {
    const current =
      bucket.get(entry.key) ??
      {
        key: entry.key,
        label: entry.label,
        male: 0,
        female: 0,
        other: 0,
        total: 0,
      };

    if (entry.gender === "HOMME") current.male += 1;
    else if (entry.gender === "FEMME") current.female += 1;
    else current.other += 1;
    current.total += 1;

    bucket.set(entry.key, current);
  }

  return [...bucket.values()].sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
}

function buildDirectionTree(nodes: Array<{ id: number; code: string; nom: string; parentId?: number | null; niveau?: number | null }>) {
  const byId = new Map<number, DirectionTreeNode>();
  for (const node of nodes) {
    byId.set(node.id, {
      id: node.id,
      code: node.code,
      nom: node.nom,
      parentId: node.parentId ?? null,
      niveau: node.niveau ?? 0,
      children: [],
    });
  }

  const roots: DirectionTreeNode[] = [];
  for (const node of byId.values()) {
    const parentId = node.parentId ?? null;
    const parent = parentId != null ? byId.get(parentId) : undefined;
    if (!parent) {
      roots.push(node);
      continue;
    }
    parent.children.push(node);
  }

  const sortTree = (items: DirectionTreeNode[]) => {
    items.sort((a, b) => {
      if (toSafeNumber(a.niveau) !== toSafeNumber(b.niveau)) {
        return toSafeNumber(a.niveau) - toSafeNumber(b.niveau);
      }
      return a.nom.localeCompare(b.nom);
    });
    items.forEach((item) => sortTree(item.children));
  };

  sortTree(roots);
  return roots;
}

export function getTypeRoots(types: OrganisationType[]) {
  const ids = new Set(types.map((type) => type.id));
  return types
    .filter((type) => !type.parentId || !ids.has(type.parentId))
    .sort((a, b) => toSafeNumber(a.ordre) - toSafeNumber(b.ordre) || a.nom.localeCompare(b.nom));
}

export function collectTypeDescendants(rootTypeId: number, types: OrganisationType[]) {
  const childrenByParent = new Map<number, number[]>();
  for (const type of types) {
    const parentId = type.parentId ?? 0;
    const list = childrenByParent.get(parentId) ?? [];
    list.push(type.id);
    childrenByParent.set(parentId, list);
  }

  const result = new Set<number>();
  const stack = [rootTypeId];
  while (stack.length) {
    const id = stack.pop()!;
    if (result.has(id)) continue;
    result.add(id);
    const children = childrenByParent.get(id) ?? [];
    children.forEach((childId) => stack.push(childId));
  }
  return [...result];
}

export function buildOverviewAnalytics(
  payload: DashAdminPayload | null,
  selectedProvinceId: number | null
): OverviewAnalytics {
  const agents = Array.isArray(payload?.AgentsPresences) ? payload!.AgentsPresences! : [];
  const provinces = Array.isArray(payload?.organisation?.provinces) ? payload!.organisation!.provinces! : [];
  const mappings = Array.isArray(payload?.organisation?.mappings) ? payload!.organisation!.mappings! : [];
  const types = Array.isArray(payload?.organisation?.types) ? payload!.organisation!.types! : [];

  const now = new Date();
  const currentAssignments: AssignmentSnapshot[] = [];
  const activeAffectationAssignments: AssignmentSnapshot[] = [];
  const filteredAgents: AgentDashboardItem[] = [];

  for (const agent of agents) {
    const gender = normalizeGender(agent?.genre);
    const affectations = Array.isArray(agent?.affectations) ? agent!.affectations! : [];
    const activeAffectations = affectations.filter((item) => isAffectationActive(item, now));
    const orderedCurrentCandidates = (activeAffectations.length ? activeAffectations : affectations).slice().sort(sortAffectationsForCurrent);
    const currentAffectation = orderedCurrentCandidates[0] ?? null;
    const currentSnapshot = buildAssignmentSnapshot(currentAffectation, gender);

    const matchesSelectedProvince =
      selectedProvinceId == null ||
      (currentSnapshot?.provinceId != null && currentSnapshot.provinceId === selectedProvinceId);

    if (matchesSelectedProvince) {
      filteredAgents.push(agent);
      if (currentSnapshot) {
        currentAssignments.push(currentSnapshot);
      }
    }

    for (const activeAffectation of activeAffectations) {
      const snapshot = buildAssignmentSnapshot(activeAffectation, gender);
      if (!snapshot) continue;
      if (selectedProvinceId != null && snapshot.provinceId !== selectedProvinceId) continue;
      activeAffectationAssignments.push(snapshot);
    }
  }

  const agentsByDirectionMap = new Map<string, { key: string; label: string; value: number }>();
  const agentsByStationMap = new Map<string, { key: string; label: string; value: number }>();
  const agentsByProvinceMap = new Map<string, { key: string; label: string; value: number }>();

  for (const item of currentAssignments) {
    incrementMap(agentsByDirectionMap, `dir:${item.directionId ?? "none"}`, item.directionLabel, 1);
    incrementMap(agentsByStationMap, `type:${item.typeId ?? "none"}`, item.typeLabel, 1);
    incrementMap(agentsByProvinceMap, `prov:${item.provinceId ?? "none"}`, item.provinceLabel, 1);
  }

  const affectationsByDirectionMap = new Map<string, { key: string; label: string; value: number }>();
  const affectationsByStationMap = new Map<string, { key: string; label: string; value: number }>();
  const affectationsByProvinceMap = new Map<string, { key: string; label: string; value: number }>();
  const affectationsBySexMap = new Map<string, { key: string; label: string; value: number }>();

  for (const item of activeAffectationAssignments) {
    incrementMap(affectationsByDirectionMap, `dir:${item.directionId ?? "none"}`, item.directionLabel, 1);
    incrementMap(affectationsByStationMap, `type:${item.typeId ?? "none"}`, item.typeLabel, 1);
    incrementMap(affectationsByProvinceMap, `prov:${item.provinceId ?? "none"}`, item.provinceLabel, 1);

    const sexLabel = item.gender === "HOMME" ? "Hommes" : item.gender === "FEMME" ? "Femmes" : "Autre";
    incrementMap(affectationsBySexMap, `sex:${item.gender}`, sexLabel, 1);
  }

  const sexByDirection = buildGenderSplit(
    currentAssignments.map((item) => ({
      key: `dir:${item.directionId ?? "none"}`,
      label: item.directionLabel,
      gender: item.gender,
    }))
  );

  const sexByStation = buildGenderSplit(
    currentAssignments.map((item) => ({
      key: `type:${item.typeId ?? "none"}`,
      label: item.typeLabel,
      gender: item.gender,
    }))
  );

  const sexByProvinceAndStation = buildGenderSplit(
    currentAssignments.map((item) => ({
      key: `provtype:${item.provinceId ?? "none"}:${item.typeId ?? "none"}`,
      label: `${item.provinceLabel} / ${item.typeLabel}`,
      gender: item.gender,
    }))
  );

  const directionNodesByType = new Map<number, Map<number, { id: number; code: string; nom: string; parentId?: number | null; niveau?: number | null }>>();
  for (const mapping of mappings) {
    const typeId = toSafeNumber(mapping?.typeUniteId);
    const direction = mapping?.uniteOrganisationnelle;
    if (!typeId || !direction?.id) continue;
    if (selectedProvinceId != null) {
      const mapProvinceId = toSafeNumber(mapping?.provinceId);
      if (mapProvinceId !== selectedProvinceId) continue;
    }
    const nodeMap = directionNodesByType.get(typeId) ?? new Map();
    nodeMap.set(direction.id, {
      id: direction.id,
      code: direction.code,
      nom: direction.nom,
      parentId: direction.parentId ?? null,
      niveau: direction.niveau ?? 0,
    });
    directionNodesByType.set(typeId, nodeMap);
  }

  const directionTreeByTypeId = new Map<number, DirectionTreeNode[]>();
  for (const [typeId, nodeMap] of directionNodesByType.entries()) {
    directionTreeByTypeId.set(typeId, buildDirectionTree([...nodeMap.values()]));
  }

  const scopedTypes =
    selectedProvinceId == null
      ? types
      : types.filter((type) =>
          (type.typeOrgaUniteProvinces ?? []).some(
            (link) => toSafeNumber(link.provinceId) === selectedProvinceId && link.actif !== false
          )
        );

  const scopedDirectionsCount = selectedProvinceId == null
    ? provinces.reduce((sum, province) => sum + toSafeNumber(province._count?.unites), 0)
    : provinces
        .filter((province) => province.id === selectedProvinceId)
        .reduce((sum, province) => sum + toSafeNumber(province._count?.unites), 0);

  return {
    filteredAgents,
    scopedStationsCount: scopedTypes.length,
    scopedDirectionsCount,
    activeAffectationsCount: activeAffectationAssignments.length,
    agentsByDirection: mapToSortedPieData(agentsByDirectionMap),
    agentsByStation: mapToSortedPieData(agentsByStationMap),
    agentsByProvince: mapToSortedPieData(agentsByProvinceMap),
    affectationsByDirection: mapToSortedPieData(affectationsByDirectionMap),
    affectationsByStation: mapToSortedPieData(affectationsByStationMap),
    affectationsByProvince: mapToSortedPieData(affectationsByProvinceMap),
    affectationsBySex: mapToSortedPieData(affectationsBySexMap, 3),
    sexByDirection: sexByDirection.slice(0, 12),
    sexByStation: sexByStation.slice(0, 12),
    sexByProvinceAndStation: sexByProvinceAndStation.slice(0, 12),
    directionTreeByTypeId,
  };
}

export function buildMonthlySeries(
  agents: AgentDashboardItem[],
  years: number[],
  dateExtractor: (agent: AgentDashboardItem) => unknown[]
) {
  const rows: TrendPoint[] = MONTH_LABELS.map((month) => {
    const point: TrendPoint = { month };
    for (const year of years) {
      point[`y${year}`] = 0;
    }
    return point;
  });

  for (const agent of agents) {
    const dates = dateExtractor(agent);
    for (const value of dates) {
      const date = parseDateValue(value);
      if (!date) continue;
      const year = date.getFullYear();
      if (!years.includes(year)) continue;
      const monthIndex = date.getMonth();
      const key = `y${year}`;
      rows[monthIndex][key] = toSafeNumber(rows[monthIndex][key]) + 1;
    }
  }

  return rows;
}

export function buildYearList() {
  const currentYear = new Date().getFullYear();
  return [currentYear - 2, currentYear - 1, currentYear];
}

export function toGenderPieData(item: GenderSplit | null | undefined): PieDatum[] {
  if (!item) return [];
  return [
    { key: `${item.key}:male`, label: "Hommes", value: item.male },
    { key: `${item.key}:female`, label: "Femmes", value: item.female },
    { key: `${item.key}:other`, label: "Autre", value: item.other },
  ].filter((entry) => entry.value > 0);
}
