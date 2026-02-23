'use client'

import { ArrowDownRight, ArrowUpRight, CalendarClock, Download, UserCheck, UserX, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, XAxis, YAxis } from "recharts";
import jsPDF from "jspdf";
import "jspdf-autotable";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useAgents } from "@/app/contexts/agents/context";
import { useGet } from "@/hooks/useApi";
import { getPaies } from "@/app/action/paie/action";
import { GetDashAgentAdmin } from "@/app/action/agent/dash/action";

type PaieItem = {
  agent?: { nom?: string; prenom?: string } | null;
  periode?: string | null;
  datePaiement?: string | Date | null;
  net?: number | string | null;
  brut?: number | string | null;
  retenues?: number | string | null;
  etat?: string | null;
  primes?: { montant?: number | string | null }[] | null;
};

type AgentUser = {
  login?: string | null;
  actif?: boolean | null;
  compteAgent?: Array<{
    dateLiaison?: string | Date | null;
    agent?: { nom?: string | null; prenom?: string | null } | null;
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

const statusClass: Record<string, string> = {
  active: "bg-[#E6F0FD] text-[#0F4A97] border-[#9FC0EA]",
  paid: "bg-[#E6F0FD] text-[#0F4A97] border-[#9FC0EA]",
  pending: "bg-[#F9F1E4] text-[#6B4B2A] border-[#E2C9A2]",
  expired: "bg-[#FEE4E2] text-[#B42318] border-[#FDA29B]",
  default: "bg-[#E8EFFB] text-[#1D4D9D] border-[#B8CBEA]",
};

const barChartConfig = {
  net: {
    label: "Total net",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const trendChartConfig = {
  net: {
    label: "Net",
    color: "var(--chart-1)",
  },
  brut: {
    label: "Brut",
    color: "var(--chart-2)",
  },
  primes: {
    label: "Primes",
    color: "var(--chart-3)",
  },
  retenues: {
    label: "Retenues",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("fr-FR");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompact(value: number) {
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
      name: fullName,
      status: user?.actif ? "active" : "pending",
      date: formatDate(linked?.dateLiaison),
    };
  });

  if (rows.length) return rows;

  return [
    { name: "Stella Powell", status: "active", date: "27/03/2026" },
    { name: "Aaron Dunn", status: "pending", date: "14/08/2026" },
    { name: "Eleanor Kim", status: "active", date: "17/11/2026" },
    { name: "Joshua Cook", status: "active", date: "09/08/2026" },
    { name: "Anna Russell", status: "pending", date: "09/08/2026" },
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

export default function AdminDashboard() {
  const { data: stats, isPending: isPendingStats } = useGet(["DashAgentAdmin"], GetDashAgentAdmin);
  const { agents, isPendingAgents } = useAgents();
  const { data: paies = [] } = useGet(["PaieAll"], getPaies);

  const paiesList: PaieItem[] = Array.isArray(paies) ? (paies as PaieItem[]) : [];
  const agentsList: AgentUser[] = Array.isArray(agents) ? (agents as AgentUser[]) : [];

  const totalSalaires = paiesList.reduce((acc, p) => acc + toNumber(p.net), 0);
  const totalPrimes = paiesList.reduce(
    (acc, p) => acc + (p.primes?.reduce((sum, prime) => sum + toNumber(prime?.montant), 0) ?? 0),
    0
  );
  const totalRetenues = paiesList.reduce((acc, p) => acc + toNumber(p.retenues), 0);

  const kpis = [
    {
      title: "Utilisateurs",
      value: formatCompact(toNumber(stats?.actif)),
      delta: "+12.4%",
      up: true,
      icon: Users,
      tone: "dashboard-stat-tone-blue",
    },
    {
      title: "Presences",
      value: formatCompact(toNumber(stats?.presences)),
      delta: "+8.1%",
      up: true,
      icon: UserCheck,
      tone: "dashboard-stat-tone-sky",
    },
    {
      title: "Absences",
      value: formatCompact(toNumber(stats?.absences)),
      delta: "-2.3%",
      up: false,
      icon: UserX,
      tone: "dashboard-stat-tone-red",
    },
    {
      title: "Conges (jours)",
      value: formatCompact(toNumber(stats?.conges)),
      delta: "+4.7%",
      up: true,
      icon: CalendarClock,
      tone: "dashboard-stat-tone-soft",
    },
  ];

  const chartsData = buildChartsData(paiesList);
  const maxBarIndex = chartsData.barData.length
    ? chartsData.barData.reduce((bestIdx, current, index, arr) =>
        current.net > arr[bestIdx].net ? index : bestIdx, 0)
    : -1;
  const latestRegistrations = buildLatestRegistrations(agentsList);
  const latestTransactions = buildLatestTransactions(paiesList);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("RTNC RH - Transactions de paie", 14, 16);
    doc.autoTable({
      head: [["Agent", "Periode", "Net", "Primes", "Retenues", "Date"]],
      body: paiesList.map((item) => [
        [item.agent?.nom, item.agent?.prenom].filter(Boolean).join(" "),
        item.periode ?? "-",
        formatCurrency(toNumber(item.net)),
        formatCurrency(item.primes?.reduce((sum, p) => sum + toNumber(p?.montant), 0) ?? 0),
        formatCurrency(toNumber(item.retenues)),
        formatDate(item.datePaiement),
      ]),
    });
    doc.save("rtnc-rh-dashboard.pdf");
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">Tableau de bord administratif RTNC RH</p>
        </div>
        <Button onClick={handleExportPDF} className="h-10 w-full md:w-auto">
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {(isPendingStats || isPendingAgents) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((idx) => (
            <Skeleton key={idx} className="h-28 rounded-2xl" />
          ))}
        </div>
      )}

      {!isPendingStats && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className={`dashboard-stat-card py-4 ${item.tone}`}>
                <CardHeader className="gap-1 px-4">
                  <div className="flex items-center justify-between">
                    <div className="rounded-lg border border-border bg-secondary p-2">
                      <Icon className="h-4 w-4" />
                    </div>
                    <Badge className={`rounded-full border text-[11px] ${item.up ? statusClass.active : statusClass.expired}`}>
                      {item.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {item.delta}
                    </Badge>
                  </div>
                  <p className="dashboard-stat-title">{item.title}</p>
                  <CardTitle className="text-3xl dashboard-stat-value">{item.value}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pt-0">
                  <p className="text-xs text-muted-foreground">Sur les 30 derniers jours</p>
                </CardContent>
              </Card>
            );
          })}
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="border border-border bg-card py-4 shadow-sm">
          <CardHeader className="px-4 pb-2">
            <CardTitle>Total Net Mensuel</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0">
            <ChartContainer config={barChartConfig} className="h-[290px] w-full">
              <BarChart data={chartsData.barData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <ChartTooltip
                  cursor={{ fill: "var(--accent)" }}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="net" radius={[10, 10, 0, 0]} maxBarSize={34}>
                  {chartsData.barData.map((entry, index) => (
                    <Cell
                      key={`${entry.month}-${index}`}
                      fill={index === maxBarIndex ? "var(--color-net)" : "var(--chart-2)"}
                      stroke={index === maxBarIndex ? "var(--color-net)" : "var(--chart-2)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card py-4 shadow-sm">
          <CardHeader className="px-4 pb-2">
            <CardTitle>Tendance Paie Multi-Series</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0">
            <ChartContainer config={trendChartConfig} className="h-[290px] w-full">
              <LineChart data={chartsData.trendData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" />
                <XAxis dataKey="d" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={54} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                <ChartTooltip
                  cursor={{ stroke: "var(--border)" }}
                  content={<ChartTooltipContent indicator="line" />}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Line name="Net" type="monotone" dataKey="net" stroke="var(--color-net)" strokeWidth={2.5} dot={false} />
                <Line name="Brut" type="monotone" dataKey="brut" stroke="var(--color-brut)" strokeWidth={2.2} dot={false} />
                <Line name="Primes" type="monotone" dataKey="primes" stroke="var(--color-primes)" strokeWidth={2.2} dot={false} />
                <Line name="Retenues" type="monotone" dataKey="retenues" stroke="var(--color-retenues)" strokeWidth={2.2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="border border-border bg-card py-4 shadow-sm">
          <CardHeader className="px-4 pb-3">
            <CardTitle>Dernieres Inscriptions</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0">
            <Table className="[&_th:first-child]:pl-4 [&_td:first-child]:pl-4 [&_th:last-child]:pr-4 [&_td:last-child]:pr-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestRegistrations.map((item, idx) => (
                  <TableRow key={`${item.name}-${idx}`}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${statusClass[item.status] || statusClass.default}`}>
                        {item.status === "active" ? "Actif" : "Pending"}
                      </span>
                    </TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" className="h-8 px-2.5">Voir</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card py-4 shadow-sm">
          <CardHeader className="px-4 pb-3">
            <CardTitle>Dernieres Transactions</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0">
            <Table className="[&_th:first-child]:pl-4 [&_td:first-child]:pl-4 [&_th:last-child]:pr-4 [&_td:last-child]:pr-4">
              <TableHeader>
                <TableRow>
                  <TableHead>Paye par</TableHead>
                  <TableHead>Pack</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestTransactions.map((item, idx) => (
                  <TableRow key={`${item.paidBy}-${idx}`}>
                    <TableCell className="font-medium">{item.paidBy}</TableCell>
                    <TableCell>{item.packageName}</TableCell>
                    <TableCell>{item.price}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${statusClass[item.status] || statusClass.default}`}>
                        {item.status === "paid"
                          ? "Paye"
                          : item.status === "expired"
                            ? "Expire"
                            : item.status === "active"
                              ? "Actif"
                              : "En attente"}
                      </span>
                    </TableCell>
                    <TableCell>{item.paidDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <Card className="border border-border bg-card py-4 shadow-sm">
        <CardHeader className="px-4 pb-2">
          <CardTitle>Resume Paie</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-4">
          <div className="flex items-center justify-between text-sm">
            <span>Total salaires</span>
            <span className="font-semibold text-foreground">{formatCurrency(totalSalaires)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Total primes</span>
            <span className="font-semibold text-foreground">{formatCurrency(totalPrimes)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Total retenues</span>
            <span className="font-semibold text-foreground">{formatCurrency(totalRetenues)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function DataEmpty() {
  return <p className="text-center text-muted-foreground">Les donnees apparaitront ici dans quelques jours.</p>;
}

export function DataEmptyPadding() {
  return <p className="p-8 text-center text-muted-foreground">Les donnees apparaitront ici dans quelques jours.</p>;
}
