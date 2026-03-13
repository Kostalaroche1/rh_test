'use client'

// Gabriel code (Habacuk design + Gabriel logic)

import { ArrowDownRight, ArrowUpRight, CalendarClock, Download, UserCheck, UserX, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, XAxis, YAxis } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  formatCompact,
  formatCurrency,
  formatDate,
  toNumber,
  useAdminDashboardData,
} from "@/features/dashboard/admin/use-admin-dashboard-data";
import AdminPresences from "../agent/presence/admin";
import AdminDemandeConge from "../agent/conges/demande/AdminDemandeConge";
import AdminTypeCOnge from "../agent/conges/AdminConge";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { BulletinPDF } from "../paie/bulletinPdf";
import PermissionManager from "../tabord/tables/permissionManager";
import { useAuth } from "@/app/contexts/auth/context";
import { canManageAccessControl, hasAnyPermission } from "@/security/permissions";

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

export default function AdminDashboard() {
  const { auth }: any = useAuth();
  const {
    stats,
    isPendingStats,
    isPendingAgents,
    totalSalaires,
    totalPrimes,
    totalRetenues,
    chartsData,
    latestRegistrations,
    latestTransactions,
    paiesList,
  } = useAdminDashboardData();
  const canReadPresence = hasAnyPermission(auth, ["presence.read", "presence.signal_absence", "presence.validate", "presence.confirm"]);
  const canReadConge = hasAnyPermission(auth, ["conge.read", "conge.request", "conge.confirm", "conge.validate"]);
  const canReadTypeConge = hasAnyPermission(auth, ["type_conge.read", "type_conge.create", "type_conge.update", "type_conge.delete"]);
  const canReadAccessControl = canManageAccessControl(auth) || hasAnyPermission(auth, ["permission.read", "role.read"]);
  const visibleTabs = [
    canReadPresence ? { value: "presence", label: "Presences & Absences" } : null,
    canReadConge ? { value: "demandeconge", label: "Demande de Conge" } : null,
    canReadTypeConge ? { value: "typeconge", label: "Type de Conge" } : null,
    canReadAccessControl ? { value: "permissions", label: "Permissions & Roles" } : null,
  ].filter(Boolean) as { value: string; label: string }[];

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

  const maxBarIndex = chartsData.barData.length
    ? chartsData.barData.reduce((bestIdx, current, index, arr) =>
      current.net > arr[bestIdx].net ? index : bestIdx, 0)
    : -1;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("RTNC RH - Transactions de paie", 14, 16);
    autoTable(doc, {
      head: [["Agent", "Periode", "Net", "Primes", "Retenues", "Date"]],
      body: paiesList.map((item) => [
        [item.agent?.nom, item.agent?.prenom].filter(Boolean).join(" "),
        item.periode ?? "-",
        formatCurrency(toNumber(item.net)),
        formatCurrency(toNumber(item.primes?.reduce((sum, p) => sum + toNumber(p?.montant), 0) ?? 0)),
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
        <PDFDownloadLink
                        document={
                          <BulletinPDF
                            paies={paiesList}
                            devise="$"
                            entreprise={{ nom: "RTNC", adresse: "Av. ...", ville: "Kinshasa", telephone: "+243..." }}
                          />
                        }
                        fileName={`bulletin-${"salaire-agents"}.pdf`}
                      >
                        {({ loading }) => (
                          <Button className="rounded-full" variant="outline" disabled={loading}>
                            {loading ? "Generation..." : "Exporter bulletin (PDF)"}
                          </Button>
                        )}
                      </PDFDownloadLink>
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
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell className="text-right">
                      {item.agentId ? (
                        <Button asChild variant="outline" size="sm" className="h-8 px-2.5">
                          <Link href={`/dashboard/agents/${item.agentId}`}>Voir</Link>
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="h-8 px-2.5" disabled>
                          Voir
                        </Button>
                      )}
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
                        {item.status}
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

      {visibleTabs.length > 0 && (
      <Tabs defaultValue={visibleTabs[0].value} className="w-full">
        <TabsList className="mb-4">
          {visibleTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
        {canReadPresence && <TabsContent value="presence">
          <AdminPresences />
        </TabsContent>}
        {canReadConge && <TabsContent value="demandeconge">
          <AdminDemandeConge />
        </TabsContent>}
        {canReadTypeConge && <TabsContent value="typeconge">
          <AdminTypeCOnge />
        </TabsContent>}
        {canReadAccessControl && <TabsContent value="permissions">
          <PermissionManager />
        </TabsContent>}
      </Tabs>
      )}
    </div>
  );
}

export function DataEmpty() {
  return <small>Aucune donnee</small>;
}

export function DataEmptyPadding() {
  return (
    <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
      <p className="text-sm text-muted-foreground">Aucune donnee disponible pour le moment.</p>
    </div>
  );
}
