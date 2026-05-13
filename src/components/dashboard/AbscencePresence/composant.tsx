'use client'

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PieChart, Pie, Cell } from "recharts";
import { Input } from "@/components/ui/input";
import { Activity, Clock3, FileText, UserCheck, UserX } from "lucide-react";
import { useGet, usePut } from "@/hooks/useApi";
import { GetDashAgentAdmin } from "@/app/action/agent/dash/action";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarPresence } from "./presence/chart/calendrier";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FichePresencePDF } from "@/utilities/exportPdf";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { toast } from "sonner";
import { computePresenceStatus } from "@/utilities/presence";
import { useAuth } from "@/app/contexts/auth/context";
import { hasAnyPermission } from "@/security/permissions";
import VuePresencePersonnelle from "@/components/dashboard/presences/VuePresencePersonnelle";
import RevuePresencesUnite from "@/components/dashboard/presences/RevuePresencesUnite";
import RevueValidationPresences from "@/components/dashboard/presences/RevueValidationPresences";
import VueEnsemblePresences from "@/components/dashboard/presences/VueEnsemblePresences";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export default function GestionPresenceAbsenceRich() {
  const { auth }: any = useAuth();
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const { data: donneesStats, isPending: enChargementStats, refetch: refetchGetAdmin } = useGet(["DashAgentAdmin"], GetDashAgentAdmin);
  const canReadPresence = hasAnyPermission(auth, ["presence.read", "presence.validate", "presence.confirm", "presence.update"]);
  const canManagePresence = hasAnyPermission(auth, ["presence.validate", "presence.confirm", "presence.update"]);
  const canSignPresence = hasAnyPermission(auth, ["presence.sign", "presence.biometric"]);
  const canConfirmPresence = hasAnyPermission(auth, ["presence.confirm"]);
  const canValidatePresence = hasAnyPermission(auth, ["presence.validate"]);
  const canReviewPresence = hasAnyPermission(auth, ["presence.read", "presence.update"]);

  const donneesCamembert = [
    { name: "Actif", value: donneesStats?.actif ?? 0, color: "#16a34a" },
    { name: "Absent", value: donneesStats?.absences ?? 0, color: "#e11d48" },
    { name: "Present", value: donneesStats?.presences ?? 0, color: "#0284c7" }
  ];

  const presenceChartConfig = {
    value: {
      label: "Agents",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  const presenceStatsCards = [
    { title: "Agents actifs", value: donneesStats?.actif ?? 0, tone: "dashboard-stat-tone-blue", icon: Activity },
    { title: "Presences", value: donneesStats?.presences ?? 0, tone: "dashboard-stat-tone-sky", icon: UserCheck },
    { title: "Absences", value: donneesStats?.absences ?? 0, tone: "dashboard-stat-tone-red", icon: UserX },
  ];

  const couleurStatut = (statutAgent: string) => {
    switch (statutAgent) {
      case "PRESENT":
        return "bg-emerald-100 text-emerald-700";
      case "ABSENT":
        return "bg-rose-100 text-rose-700";
      case "RETARD":
        return "bg-amber-100 text-amber-700";
      case "CONGE":
        return "bg-indigo-100 text-indigo-700";
      case "MISSION":
        return "bg-cyan-100 text-cyan-700";
      case "MALADIE":
        return "bg-fuchsia-100 text-fuchsia-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const [matricule, setMatricule] = useState("ALL");
  const [statut, setStatut] = useState("ALL");
  const [periode, setPeriode] = useState("TODAY");
  const [page, setPage] = useState(1);

  const ELEMENTS_PAR_PAGE = 5;

  const agentsFiltres = useMemo(() => {
    if (!donneesStats?.AgentsPresences) return [];

    const dateActuelle = new Date();

    return donneesStats.AgentsPresences
      .filter((agent: any) => (matricule === "ALL" ? true : agent.matricule === matricule))
      .map((agent: any) => ({
        ...agent,
        presences: (agent.presences || []).filter((p: any) => {
          const datePresence = new Date(p.date);
          const statutCalcule = computePresenceStatus(p);

          if (statut !== "ALL" && statutCalcule !== statut) return false;

          switch (periode) {
            case "TODAY":
              return datePresence.toDateString() === dateActuelle.toDateString();
            case "YESTERDAY": {
              const dateHier = new Date(dateActuelle);
              dateHier.setDate(dateActuelle.getDate() - 1);
              return datePresence.toDateString() === dateHier.toDateString();
            }
            case "WEEK": {
              const ilYAUneSemaine = new Date(dateActuelle);
              ilYAUneSemaine.setDate(dateActuelle.getDate() - 7);
              return datePresence >= ilYAUneSemaine;
            }
            case "THIS_WEEK": {
              const debutSemaine = new Date(dateActuelle);
              debutSemaine.setDate(dateActuelle.getDate() - dateActuelle.getDay());
              return datePresence >= debutSemaine;
            }
            case "MONTH_1": {
              const ilYAUnMois = new Date(dateActuelle);
              ilYAUnMois.setMonth(dateActuelle.getMonth() - 1);
              return datePresence >= ilYAUnMois;
            }
            case "MONTH_2": {
              const ilYADeuxMois = new Date(dateActuelle);
              ilYADeuxMois.setMonth(dateActuelle.getMonth() - 2);
              return datePresence >= ilYADeuxMois;
            }
            case "LAST_YEAR":
              return datePresence.getFullYear() === dateActuelle.getFullYear() - 1;
            default:
              return true;
          }
        })
      }))
      .filter((a: any) => a.presences.length > 0);
  }, [donneesStats, matricule, statut, periode]);

  const nombrePages = Math.ceil(agentsFiltres.length / ELEMENTS_PAR_PAGE);
  const nombrePagesSecurise = Math.max(1, nombrePages);

  useEffect(() => {
    if (page > nombrePagesSecurise) setPage(1);
  }, [page, nombrePagesSecurise]);

  const agentsPages = useMemo(() => {
    const indexDepart = (page - 1) * ELEMENTS_PAR_PAGE;
    return agentsFiltres.slice(indexDepart, indexDepart + ELEMENTS_PAR_PAGE);
  }, [agentsFiltres, page]);

  const availableTabs = [
    { value: "dashboard", label: "Dashboard", visible: canReadPresence },
    { value: "tableau", label: "Tableau", visible: canReadPresence },
    { value: "calendrier", label: "Calendrier", visible: canReadPresence },
    { value: "pointage", label: "Pointer", visible: canSignPresence },
    { value: "confirmation", label: "Confirmer", visible: canConfirmPresence },
    { value: "validation", label: "Valider", visible: canValidatePresence },
    { value: "suivi", label: "Suivi", visible: canReviewPresence },
  ].filter((tab) => tab.visible);

  return (
    <div className="erp-page">
      {!canReadPresence && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Aucun acces en lecture sur les presences et absences.
          </CardContent>
        </Card>
      )}
      {canReadPresence && (
      <>
      <div className="erp-panel rounded-2xl p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight">Gestion des Presences et Absences</h1>
            <p className="text-muted-foreground">Tableau complet des agents et suivi de leur presence</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-emerald-100 px-3 py-1 text-emerald-700">
              <UserCheck className="mr-1 h-4 w-4" /> Presences
            </Badge>
            <Badge variant="secondary" className="bg-rose-100 px-3 py-1 text-rose-700">
              <UserX className="mr-1 h-4 w-4" /> Absences
            </Badge>
            <Badge variant="secondary" className="bg-sky-100 px-3 py-1 text-sky-700">
              <Clock3 className="mr-1 h-4 w-4" /> Ponctualite
            </Badge>
          </div>
        </div>
      </div>

      <Separator />

      <Tabs defaultValue={availableTabs[0]?.value ?? "dashboard"} className="w-full">
        <TabsList className="mb-4 md :flex align-center">
          {availableTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {enChargementStats && <Skeleton className="p-20" />}

        <TabsContent value="dashboard" className="flex flex-col gap-6">
          {!enChargementStats && donneesStats && (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                {presenceStatsCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Card key={item.title} className={`dashboard-stat-card py-4 ${item.tone}`}>
                      <CardHeader className="flex flex-row items-center justify-between gap-2 px-4 pb-2">
                        <p className="dashboard-stat-title">{item.title}</p>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent className="px-4 pt-0">
                        <p className="dashboard-stat-value text-3xl">{item.value}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="border border-border bg-card py-4 shadow-sm">
                <CardHeader className="px-4 pb-2">
                  <CardTitle>Etat des agents</CardTitle>
                  <CardDescription>Actif, absent ou present</CardDescription>
                </CardHeader>
                <CardContent className="px-4 pt-0">
                  <ChartContainer config={presenceChartConfig} className="h-64 w-full">
                    <PieChart>
                      <Pie data={donneesCamembert} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} label>
                        {donneesCamembert.map((entry, idx) => (
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

        <TabsContent value="tableau" className="flex flex-col gap-6">
          <Card className="erp-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Filtres</CardTitle>
              <CardDescription>Affiner par matricule, statut et periode</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              <Select value={matricule} onValueChange={setMatricule}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Matricule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous</SelectItem>
                  {donneesStats?.AgentsPresences?.map((agent: any) => (
                    <SelectItem key={agent.id} value={agent.matricule} title={agent.nom}>
                      {agent.matricule}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statut} onValueChange={setStatut}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous</SelectItem>
                  <SelectItem value="PRESENT">Present</SelectItem>
                  <SelectItem value="ABSENT">Absent</SelectItem>
                  <SelectItem value="RETARD">Retard</SelectItem>
                </SelectContent>
              </Select>

              <Select value={periode} onValueChange={setPeriode}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAY">Aujourd hui</SelectItem>
                  <SelectItem value="YESTERDAY">Hier</SelectItem>
                  <SelectItem value="WEEK">Il y a 1 semaine</SelectItem>
                  <SelectItem value="THIS_WEEK">Dans la semaine</SelectItem>
                  <SelectItem value="MONTH_1">Il y a 1 mois</SelectItem>
                  <SelectItem value="MONTH_2">Il y a 2 mois</SelectItem>
                  <SelectItem value="LAST_YEAR">Annee passee</SelectItem>
                </SelectContent>
              </Select>
              <PDFDownloadLink
                document={
                  <FichePresencePDF
                    ficheData={{
                      orgName: "RADIO TELEVISION NATIONALE CONGOLAISE (RTNC)",
                      orgAddress: "Chaine de télévision",
                      periodeLabel: `________________________________________________`,
                      responsable: "_____________________",
                      // export EXACTEMENT la liste filtrée
                      agents: agentsFiltres,
                    }}
                  />
                }
                fileName={`fiche-presence-${periode}-${statut}-${matricule}.pdf`}
              >
                {({ loading }) => (
                  <Button variant="outline" disabled={loading}>
                    <FileText className="mr-2 h-4 w-4" />
                    {loading ? "Génération..." : "Exporter liste (PDF)"}
                  </Button>
                )}
              </PDFDownloadLink>
            </CardContent>


          </Card>

          {enChargementStats && <Skeleton className="h-40 w-full" />}

          {!enChargementStats && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Liste des presences</CardTitle>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Heure depart</TableHead>
                      {canManagePresence && <TableHead>Action</TableHead>}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {agentsPages.flatMap((agent: any) =>
                      agent.presences.map((p: any) => {
                        const statutCalcule = computePresenceStatus(p);
                        return (
                          <React.Fragment key={p.id}>
                            <TableRow className="hover:bg-slate-50">
                              <TableCell>
                                {agent.nom} {agent.prenom}
                              </TableCell>

                              <TableCell>
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${couleurStatut(statutCalcule)}`}>
                                  {statutCalcule}
                                </span>
                              </TableCell>

                              <TableCell>{new Date(p.date).toLocaleDateString()}</TableCell>

                              <TableCell>
                                {p.heureDepart
                                  ? new Date(p.heureDepart).toLocaleTimeString("fr-FR", {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })
                                  : "-"}
                              </TableCell>

                              {canManagePresence && <TableCell>-</TableCell>}

                            </TableRow>
                          </React.Fragment>
                        )
                      }
                      ))}
                  </TableBody>
                </Table>

                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    Precedent
                  </Button>

                  <span className="px-3 py-1 text-sm">Page {page} / {nombrePagesSecurise}</span>

                  <Button variant="outline" disabled={page === nombrePagesSecurise} onClick={() => setPage((p) => p + 1)}>
                    Suivant
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendrier" className="flex flex-col gap-6">
          <CalendarPresence stats={donneesStats} />
        </TabsContent>

        {canSignPresence && (
          <TabsContent value="pointage" className="flex flex-col gap-6">
            <VuePresencePersonnelle />
          </TabsContent>
        )}

        {canConfirmPresence && (
          <TabsContent value="confirmation" className="flex flex-col gap-6">
            <RevuePresencesUnite />
          </TabsContent>
        )}

        {canValidatePresence && (
          <TabsContent value="validation" className="flex flex-col gap-6">
            <RevueValidationPresences />
          </TabsContent>
        )}

        {canReviewPresence && (
          <TabsContent value="suivi" className="flex flex-col gap-6">
            <VueEnsemblePresences />
          </TabsContent>
        )}

        <TabsContent value="rapports" className="flex flex-col gap-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Exporter les donnees</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-5 w-5" /> Export CSV
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-5 w-5" /> Export PDF
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOuvert} onOpenChange={setDialogOuvert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer presence / absence</DialogTitle>
          </DialogHeader>
          <form className="flex flex-col gap-4">
            <Input placeholder="Nom de l'agent" />
            <select className="rounded border p-2">
              <option>Present</option>
              <option>Absent</option>
              <option>Retard</option>
              <option>Teletravail</option>
            </select>
            <Button type="submit" className="mt-2">
              Enregistrer
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      </>
      )}
    </div>
  );
}

