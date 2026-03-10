import { useMemo } from "react";
import { useGet } from "@/hooks/useApi";
import { useAgents } from "@/app/contexts/agents/context";
import { getPaies } from "@/app/action/paie/action";
import { GetDashAgentAdmin } from "@/app/action/agent/dash/action";

export type PaieItem = {
  agent?: { nom?: string; prenom?: string } | null;
  periode?: string | null;
  datePaiement?: string | Date | null;
  net?: number | string | null;
  brut?: number | string | null;
  retenues?: number | string | null;
  etat?: string | null;
  primes?: { montant?: number | string | null }[] | null;
};

export type AgentUser = {
  login?: string | null;
  actif?: boolean | null;
  compteAgent?: Array<{
    dateLiaison?: string | Date | null;
    agent?: { id?: number | null; nom?: string | null; prenom?: string | null } | null;
  }>;
};

const MONTHS = ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"];
const FALLBACK_BAR = [4300, 4900, 2600, 4200, 1800, 3200];
const FALLBACK_TREND = [
  { d: "1", net: 3200, brut: 4100, primes: 2200, retenues: 1800 },
  { d: "2", net: 4900, brut: 4200, primes: 3100, retenues: 2900 },
  { d: "3", net: 4200, brut: 3000, primes: 2900, retenues: 2600 },
  { d: "4", net: 5000, brut: 3300, primes: 3200, retenues: 3000 },
  { d: "5", net: 4600, brut: 3600, primes: 4100, retenues: 3400 },
  { d: "6", net: 5300, brut: 4100, primes: 3800, retenues: 3100 },
  { d: "7", net: 4500, brut: 3700, primes: 3400, retenues: 2200 },
  { d: "8", net: 5100, brut: 3100, primes: 3300, retenues: 2800 },
  { d: "9", net: 4800, brut: 2800, primes: 3100, retenues: 2500 },
  { d: "10", net: 5400, brut: 3200, primes: 3500, retenues: 3000 },
  { d: "11", net: 5600, brut: 3600, primes: 3700, retenues: 3400 },
  { d: "12", net: 5200, brut: 3300, primes: 3600, retenues: 2900 },
  { d: "13", net: 6000, brut: 2400, primes: 4600, retenues: 4300 },
  { d: "14", net: 5800, brut: 2400, primes: 4300, retenues: 4700 },
  { d: "15", net: 6700, brut: 1400, primes: 5100, retenues: 5800 },
];

export function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatDate(value: string | Date | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("fr-FR");
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function buildChartsData(paiesList: PaieItem[]) {
  const perMonth = Array.from({ length: 12 }, (_, index) => ({
    month: MONTHS[index],
    net: 0,
    brut: 0,
    primes: 0,
    retenues: 0,
  }));

  for (const paie of paiesList) {
    if (!paie.datePaiement) continue;
    const date = new Date(paie.datePaiement);
    if (Number.isNaN(date.getTime())) continue;
    const idx = date.getMonth();

    perMonth[idx].net += toNumber(paie.net);
    perMonth[idx].brut += toNumber(paie.brut);
    perMonth[idx].retenues += toNumber(paie.retenues);
    perMonth[idx].primes += paie.primes?.reduce((sum, p) => sum + toNumber(p?.montant), 0) ?? 0;
  }

  const hasRealData = perMonth.some((item) => item.net > 0 || item.brut > 0 || item.primes > 0 || item.retenues > 0);

  if (!hasRealData) {
    const barData = MONTHS.slice(0, 6).map((month, index) => ({
      month,
      net: FALLBACK_BAR[index],
    }));
    return {
      barData,
      trendData: FALLBACK_TREND,
    };
  }

  const barData = perMonth.slice(0, 6).map((item) => ({
    month: item.month,
    net: Math.round(item.net),
  }));

  const trendData = perMonth.map((item, index) => ({
    d: String(index + 1),
    net: Math.round(item.net),
    brut: Math.round(item.brut),
    primes: Math.round(item.primes),
    retenues: Math.round(item.retenues),
  }));

  return { barData, trendData };
}

function buildLatestRegistrations(agentsList: AgentUser[]) {
  const rows = agentsList.slice(0, 5).map((user) => {
    const linked = Array.isArray(user?.compteAgent) ? user.compteAgent[0] : undefined;
    const agent = linked?.agent;
    const fullName = agent?.nom
      ? [agent.nom, agent?.prenom].filter(Boolean).join(" ")
      : user?.login || "Utilisateur";
    return {
      agentId: agent?.id ?? null,
      name: fullName,
      status: user.actif ? 'actif' : 'inactif',
      date: formatDate(linked?.dateLiaison),
    };
  });

  if (rows.length) return rows;

  return [
    { agentId: null, name: "Stella Powell", status: "active", date: "27/03/2026" },
    { agentId: null, name: "Aaron Dunn", status: "pending", date: "14/08/2026" },
    { agentId: null, name: "Eleanor Kim", status: "active", date: "17/11/2026" },
    { agentId: null, name: "Joshua Cook", status: "active", date: "09/08/2026" },
    { agentId: null, name: "Anna Russell", status: "pending", date: "09/08/2026" },
  ];
}

function buildLatestTransactions(paiesList: PaieItem[]) {
  const rows = [...paiesList]
    .sort((a, b) => new Date(b.datePaiement || 0).getTime() - new Date(a.datePaiement || 0).getTime())
    .slice(0, 5)
    .map((item) => ({
      paidBy: [item.agent?.nom, item.agent?.prenom].filter(Boolean).join(" ") || "Agent",
      packageName: item.periode || "Salaire",
      price: formatCurrency(toNumber(item.net)),
      status: (item.etat || "paid").toLowerCase(),
      paidDate: formatDate(item.datePaiement),
    }));

  if (rows.length) return rows;

  return [
    { paidBy: "Stella Powell", packageName: "Starter", price: "$11.99", status: "expired", paidDate: "27/03/2026" },
    { paidBy: "Aaron Dunn", packageName: "Professional", price: "$24", status: "active", paidDate: "14/08/2026" },
    { paidBy: "Eleanor Kim", packageName: "Organization", price: "$39", status: "active", paidDate: "17/11/2026" },
    { paidBy: "Joshua Cook", packageName: "Starter", price: "$11.99", status: "expired", paidDate: "09/08/2026" },
    { paidBy: "Anna Russell", packageName: "Starter", price: "$11.99", status: "active", paidDate: "09/08/2026" },
  ];
}

export function useAdminDashboardData() {
  const { data: stats, isPending: isPendingStats } = useGet(["DashAgentAdmin"], GetDashAgentAdmin);
  const { agents, isPendingAgents } = useAgents();
  const { data: paies = [] } = useGet(["PaieAll"], getPaies);

  return useMemo(() => {
    const paiesList: PaieItem[] = Array.isArray(paies) ? (paies as PaieItem[]) : [];
    const agentsList: AgentUser[] = Array.isArray(agents) ? (agents as AgentUser[]) : [];

    const totalSalaires = paiesList.reduce((acc, p) => acc + toNumber(p.net), 0);
    const totalPrimes = paiesList.reduce(
      (acc, p) => acc + (p.primes?.reduce((sum, prime) => sum + toNumber(prime?.montant), 0) ?? 0),
      0
    );
    const totalRetenues = paiesList.reduce((acc, p) => acc + toNumber(p.retenues), 0);

    return {
      stats,
      isPendingStats,
      isPendingAgents,
      totalSalaires,
      totalPrimes,
      totalRetenues,
      chartsData: buildChartsData(paiesList),
      latestRegistrations: buildLatestRegistrations(agentsList),
      latestTransactions: buildLatestTransactions(paiesList),
      paiesList,
    };
  }, [agents, isPendingAgents, isPendingStats, paies, stats]);
}

