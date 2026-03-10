"use client"

// Gabriel code (Habacuk design + Gabriel logic for presence/demande conge)

import { useEffect, useState } from "react";
import { AlertCircle, CrossIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { useGet } from "@/hooks/useApi";
import { GETAgentServices } from "@/app/action/carrieres/agents/action";
import { GetDashAgentAdmin } from "@/app/action/agent/dash/action";
import { AddConge, DeleteConge, GetVacance, UpdateTypeConge } from "@/app/action/conge/action";
import { TypeConge } from "@/utilities/type";
import { TypeCongeList } from "./TabList";
import ChefTeamPresence from "../agent/presence/ChiefPresence";
import ChefServiceDemandeConge from "../agent/conges/demande/ChefServiceDemandeConge";
import TableHoraireAgent from "./tableHoraireAgent";

export default function ChefServiceDashboardUltra() {
  const [openNewConge, setOpenNewConge] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [selectedType, setSelectedType] = useState<TypeConge | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [typeHolidays, setTypeHolidays] = useState<TypeConge[]>([]);
  const [searchAgent, setSearchAgent] = useState("");
  const [agentPage, setAgentPage] = useState(1);

  const { data: agentsServices, isPending } = useGet(["AgentServices"], GETAgentServices);
  const { data: stats, isPending: isPendingStats } = useGet(["DashAgentAdmin"], GetDashAgentAdmin);

  const PAGE_SIZE = 14;

  const pieData = [
    { name: "Actif", value: stats ? stats.actif : 15, color: "#4ade80" },
    { name: "Absent", value: stats ? stats.absences : 3, color: "#f87171" },
    { name: "En conge", value: stats ? stats.enconges : 5, color: "#facc15" },
    { name: "Present", value: stats ? stats.presences : 5, color: "#8d2562" },
  ];

  const barPerformance = [
    { mois: "Jan", performance: 80 },
    { mois: "Fev", performance: 95 },
    { mois: "Mar", performance: 70 },
    { mois: "Avr", performance: 90 },
  ];

  const statsCards = [
    { title: "Agents actifs", value: stats ? stats.actif : 0, tone: "dashboard-stat-tone-blue" },
    { title: "Conges restants totaux", value: `${stats ? stats.conges : 0} jours`, tone: "dashboard-stat-tone-soft" },
    { title: "Presences", value: stats ? stats.presences : 0, tone: "dashboard-stat-tone-sky" },
    { title: "Demandes conges", value: stats ? stats.demandeconges : 0, tone: "dashboard-stat-tone-blue" },
    { title: "Absences", value: stats ? stats.absences : 0, tone: "dashboard-stat-tone-red" },
  ];

  const pieChartConfig = {
    value: {
      label: "Agents",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  const performanceChartConfig = {
    performance: {
      label: "Performance",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;

  const alerts = [
    { message: "Absence non justifiee detectee", type: "warning" },
    { message: "Nouvelle formation disponible", type: "info" },
    { message: "Conge approche depasse", type: "error" },
  ];

  const filteredAgents = (agentsServices || []).filter((agent: any) => {
    const query = searchAgent.trim().toLowerCase();
    if (!query) return true;
    const nom = `${agent?.nom || ""}`.toLowerCase();
    const poste = `${agent?.poste || ""}`.toLowerCase();
    const statut = `${agent?.statut || ""}`.toLowerCase();
    const conges = `${agent?.conges || ""}`.toLowerCase();
    return nom.includes(query) || poste.includes(query) || statut.includes(query) || conges.includes(query);
  });

  useEffect(() => {
    setAgentPage(1);
  }, [searchAgent]);

  const totalAgentPages = Math.max(1, Math.ceil(filteredAgents.length / PAGE_SIZE));
  const currentAgentPage = Math.min(agentPage, totalAgentPages);
  const paginatedAgents = filteredAgents.slice(
    (currentAgentPage - 1) * PAGE_SIZE,
    currentAgentPage * PAGE_SIZE
  );




  return (
    <div className="erp-page">
      <div>
        <h1 className="text-3xl font-bold mb-1">Dashboard Directeur de Direction</h1>
        <p className="text-muted-foreground">Vue complete de votre service avec tous les indicateurs</p>
      </div>
      <Separator />
      <Tabs defaultValue="dashboard" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="demandeConge">Demande Conges</TabsTrigger>
          <TabsTrigger value="presence">Presence</TabsTrigger>
          <TabsTrigger value="Horaireagent">Horaire Agent</TabsTrigger>
        </TabsList>

        <TabsContent value="demandeConge">
          <ChefServiceDemandeConge />
        </TabsContent>

        <TabsContent value="presence">
          <ChefTeamPresence />
        </TabsContent>

        <TabsContent value="Horaireagent">
          <TableHoraireAgent />
        </TabsContent>

        {isPendingStats && <Skeleton className="p-20" />}
        <TabsContent value="dashboard" className="flex flex-col gap-6">
          {!isPending && stats && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                {statsCards.map((item) => (
                  <Card key={item.title} className={`dashboard-stat-card py-4 ${item.tone}`}>
                    <CardHeader className="gap-1 px-4 pb-2">
                      <p className="dashboard-stat-title">{item.title}</p>
                      <CardTitle className="dashboard-stat-value text-3xl">{item.value}</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pt-0">
                      <p className="text-xs text-muted-foreground">Mise a jour en temps reel</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card className="border border-border bg-card py-4 shadow-sm">
                <CardHeader className="px-4 pb-2">
                  <CardTitle>Etat des agents</CardTitle>
                  <CardDescription>Actif, absent ou en conge</CardDescription>
                </CardHeader>
                <CardContent className="px-4 pt-0">
                  <ChartContainer config={pieChartConfig} className="h-64 w-full">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} label>
                        {pieData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle>Agents du service</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <Input
                  value={searchAgent}
                  onChange={(e) => setSearchAgent(e.target.value)}
                  placeholder="Rechercher nom, poste, statut..."
                  className="w-full md:max-w-sm"
                />
                <p className="text-sm text-muted-foreground">
                  Total: {(agentsServices || []).length} | Resultats: {filteredAgents.length}
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Poste</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Conges</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isPending && <Skeleton className={"w-full py-10"} />}
                  {!isPending &&
                    paginatedAgents.map((agent: any, idx: any) => (
                      <TableRow key={idx}>
                        <TableCell>{agent.nom}</TableCell>
                        <TableCell>{agent.poste}</TableCell>
                        <TableCell>{agent.statut}</TableCell>
                        <TableCell>{agent.conges}</TableCell>
                      </TableRow>
                    ))}
                  {!isPending && paginatedAgents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-4 text-center text-muted-foreground">
                        Aucun resultat
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAgentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentAgentPage <= 1}
                >
                  Precedent
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentAgentPage} / {totalAgentPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAgentPage((prev) => Math.min(totalAgentPages, prev + 1))}
                  disabled={currentAgentPage >= totalAgentPages}
                >
                  Suivant
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="budget">
          <Card>
            <CardHeader>
              <CardTitle>Performance & Budget</CardTitle>
              <CardDescription>Suivi des KPI et budget du service</CardDescription>
            </CardHeader>
            <CardContent className="h-64">
              <ChartContainer config={performanceChartConfig} className="h-full w-full">
                <BarChart data={barPerformance} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="mois" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="performance" fill="var(--color-performance)" radius={8} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Tabs>
        <TabsContent value="alerts">
          <div className="grid gap-4 md:grid-cols-2">
            {alerts.map((alert, idx) => (
              <Card
                key={idx}
                className={`p-4 ${alert.type === "warning" ? "bg-yellow-100" : alert.type === "error" ? "bg-red-100" : "bg-blue-100"}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" /> {alert.type.toUpperCase()}
                  </CardTitle>
                </CardHeader>
                <CardContent>{alert.message}</CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

    </div>
  );
}
