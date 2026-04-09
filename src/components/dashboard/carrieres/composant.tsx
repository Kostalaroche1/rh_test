"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { GetAgentsForCarriere, GetAgentsProchesRetraite, ValidationCarriere } from "@/app/action/carrieres/agents/action";
import { GetAffectations } from "@/app/action/affectations/action";
import { useAuth } from "@/app/contexts/auth/context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGet, usePut } from "@/hooks/useApi";
import { hasAnyPermission } from "@/security/permissions";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-muted ${className || "h-6 w-full"}`}></div>
);

const statutColor = (statut: string) => {
  switch (statut) {
    case "VALIDE":
      return "bg-green-100 text-green-700";
    case "EN_ATTENTE":
      return "bg-amber-500/20 text-amber-500";
    case "REJETE":
    case "REJET":
      return "bg-red-100 text-red-700";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export default function GestionCarriere() {
  const { auth }: any = useAuth();
  const canReadCarriere = hasAnyPermission(auth, ["affectation.read", "agent.read"]);
  const canValidateCarriere = hasAnyPermission(auth, ["affectation.update", "affectation.assign"]);

  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({ id: 0, agentId: 0, dateFin: "", statut: "", typeContrat: "", statutContrat: "", motif: "" });

  const { data: agentsRaw = [], isPending: loadingAgents } = useGet(["agentsCarriere"], GetAgentsForCarriere);
  const { data: carrieresRaw = [], isPending: loadingCarrieres, refetch: refetchCarrieres } = useGet(["carrieres"], GetAffectations);
  const { data: prochesRetraiteRaw = [], isPending: loadingRetraite } = useGet(["prochesRetraite"], GetAgentsProchesRetraite);
  const { mutateAsync: validateCarriere, isPending: validating } = usePut(ValidationCarriere);

  const agents = Array.isArray(agentsRaw) ? agentsRaw as any[] : [];
  const carrieres = Array.isArray(carrieresRaw) ? carrieresRaw as any[] : [];
  const prochesRetraite = Array.isArray(prochesRetraiteRaw) ? prochesRetraiteRaw as any[] : [];

  const totalAgents = useMemo(() => agents.length, [agents]);
  const agentsActifs = useMemo(() => agents.filter((agent) => agent.actif).length, [agents]);
  const agentsProchesRetraiteCount = useMemo(() => prochesRetraite.length, [prochesRetraite]);
  const decisionsEnAttente = useMemo(() => carrieres.filter((carriere) => carriere.statut === "EN_ATTENTE").length, [carrieres]);

  async function submitDecision(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formData.id || !formData.dateFin) {
      toast.warning("Veuillez renseigner la date de fin et l'affectation concernee.");
      return;
    }

    const response = await validateCarriere(formData);
    toast.info(response?.status === 200 ? "Decision enregistree avec succes" : "Echec de validation");
    await refetchCarrieres();
    setOpenDialog(false);
    setFormData({ id: 0, agentId: 0, dateFin: "", statut: "", typeContrat: "", statutContrat: "", motif: "" });
  }

  async function rejectDecision() {
    if (!formData.id) {
      toast.warning("Veuillez selectionner une affectation.");
      return;
    }
    const response = await validateCarriere(formData);
    toast.info(response?.status === 200 ? "Decision rejetee avec succes" : "Echec de rejet");
    await refetchCarrieres();
    setOpenDialog(false);
    setFormData({ id: 0, agentId: 0, dateFin: "", statut: "", typeContrat: "", statutContrat: "", motif: "" });
  }

  return (
    <div className="erp-page">
      {!canReadCarriere && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">Aucun acces en lecture sur le module carrieres.</CardContent>
        </Card>
      )}

      {canReadCarriere && (
        <>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold">Tableau de bord</h1>
            <p className="text-muted-foreground">Suivi des agents, carrieres et decisions</p>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card className="dashboard-stat-card dashboard-stat-tone-blue py-4">
              <CardHeader className="gap-1 px-4 pb-2"><p className="dashboard-stat-title">Agents totaux</p><CardTitle className="dashboard-stat-value text-3xl">{loadingAgents ? <Skeleton className="h-8 w-16" /> : totalAgents}</CardTitle></CardHeader>
              <CardContent className="px-4 pt-0"><p className="text-xs text-muted-foreground">Suivi global des effectifs</p></CardContent>
            </Card>
            <Card className="dashboard-stat-card dashboard-stat-tone-sky py-4">
              <CardHeader className="gap-1 px-4 pb-2"><p className="dashboard-stat-title">Agents actifs</p><CardTitle className="dashboard-stat-value text-3xl">{loadingAgents ? <Skeleton className="h-8 w-16" /> : agentsActifs}</CardTitle></CardHeader>
              <CardContent className="px-4 pt-0"><p className="text-xs text-muted-foreground">Population active</p></CardContent>
            </Card>
            <Card className="dashboard-stat-card dashboard-stat-tone-red py-4">
              <CardHeader className="gap-1 px-4 pb-2"><p className="dashboard-stat-title">Proches de la retraite</p><CardTitle className="dashboard-stat-value text-3xl">{loadingRetraite ? <Skeleton className="h-8 w-16" /> : agentsProchesRetraiteCount}</CardTitle></CardHeader>
              <CardContent className="px-4 pt-0"><p className="text-xs text-muted-foreground">Anticipation des departs</p></CardContent>
            </Card>
            <Card className="dashboard-stat-card dashboard-stat-tone-soft py-4">
              <CardHeader className="gap-1 px-4 pb-2"><p className="dashboard-stat-title">Decisions en attente</p><CardTitle className="dashboard-stat-value text-3xl">{loadingCarrieres ? <Skeleton className="h-8 w-16" /> : decisionsEnAttente}</CardTitle></CardHeader>
              <CardContent className="px-4 pt-0"><p className="text-xs text-muted-foreground">Dossiers a traiter</p></CardContent>
            </Card>
          </div>

          <Tabs defaultValue="agents" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="carriere">Carriere & decisions</TabsTrigger>
              <TabsTrigger value="retraite">Retraite</TabsTrigger>
            </TabsList>

            <TabsContent value="agents">
              <Card className="w-full">
                <CardHeader><CardTitle>Liste des agents</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Genre</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date d'entree</TableHead>
                        <TableHead>Unite</TableHead>
                        <TableHead>Poste</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Age</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingAgents
                        ? Array.from({ length: 5 }).map((_, index) => (
                            <TableRow key={index} className="hover:bg-muted/50">
                              <TableCell><Skeleton /></TableCell>
                              <TableCell><Skeleton className="w-16" /></TableCell>
                              <TableCell><Skeleton className="w-20" /></TableCell>
                              <TableCell><Skeleton className="w-24" /></TableCell>
                              <TableCell><Skeleton className="w-24" /></TableCell>
                              <TableCell><Skeleton className="w-28" /></TableCell>
                              <TableCell><Skeleton className="w-24" /></TableCell>
                              <TableCell><Skeleton className="w-12" /></TableCell>
                            </TableRow>
                          ))
                        : agents.map((agent: any) => {
                            const lastAff = agent.affectations?.[agent.affectations.length - 1];
                            const age = agent.datenais ? Math.floor((Date.now() - new Date(agent.datenais).getTime()) / (1000 * 60 * 60 * 24 * 365)) : "...";
                            return (
                              <TableRow key={agent.id} className="hover:bg-muted/50">
                                <TableCell>{agent.nom} {agent.prenom}</TableCell>
                                <TableCell>{agent.genre}</TableCell>
                                <TableCell><span className={`rounded-full px-2 py-1 text-sm font-medium ${agent.actif ? "bg-emerald-500/18 text-emerald-500" : "bg-rose-500/18 text-rose-500"}`}>{agent.actif ? "Actif" : "Inactif"}</span></TableCell>
                                <TableCell>{agent.dateEntree ? new Date(agent.dateEntree).toLocaleDateString() : "..."}</TableCell>
                                <TableCell>{lastAff?.uniteOrganisationnelle?.nom || "..."}</TableCell>
                                <TableCell>{lastAff?.poste?.libelle || "..."}</TableCell>
                                <TableCell>{lastAff?.grade?.libelle || "..."}</TableCell>
                                <TableCell>{age}</TableCell>
                              </TableRow>
                            );
                          })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="carriere" className="flex flex-col gap-4">
              <Card className="w-full">
                <CardHeader><CardTitle>Decisions RH</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Statut</TableHead>
                        {canValidateCarriere && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loadingCarrieres
                        ? Array.from({ length: 5 }).map((_, index) => (
                            <TableRow key={index} className="hover:bg-muted/50">
                              <TableCell><Skeleton /></TableCell>
                              <TableCell><Skeleton className="w-16" /></TableCell>
                              <TableCell><Skeleton className="w-20" /></TableCell>
                              <TableCell><Skeleton className="w-16" /></TableCell>
                              {canValidateCarriere && <TableCell><Skeleton className="w-20" /></TableCell>}
                            </TableRow>
                          ))
                        : carrieres.map((carriere: any) => (
                            <TableRow key={carriere.id} className="hover:bg-muted/50">
                              <TableCell>{carriere.agent?.nom} {carriere.agent?.prenom}</TableCell>
                              <TableCell>{carriere.type}</TableCell>
                              <TableCell>{new Date(carriere.dateDebut).toLocaleDateString()}</TableCell>
                              <TableCell><span className={`rounded-full px-2 py-1 text-sm font-medium ${statutColor(carriere.statut)}`}>{carriere.statut}</span></TableCell>
                              {canValidateCarriere && (
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="outline" size="sm">Actions</Button></DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setFormData((prev) => ({
                                            ...prev,
                                            statut: "VALIDE",
                                            id: Number(carriere.id),
                                            agentId: Number(carriere.agentId ?? 0),
                                          }));
                                          setOpenDialog(true);
                                        }}
                                      >
                                        Approuver
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={async () => {
                                          const payload = {
                                            ...formData,
                                            id: Number(carriere.id),
                                            agentId: Number(carriere.agentId ?? 0),
                                            statut: "REJETE",
                                          };
                                          const response = await validateCarriere(payload);
                                          toast.info(response?.status === 200 ? "Decision rejetee avec succes" : "Echec de rejet");
                                          await refetchCarrieres();
                                        }}
                                      >
                                        Rejeter
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="retraite">
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Agents proches de la retraite</CardTitle>
                  <CardDescription>Agents ayant 60 ans ou plus</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {loadingRetraite
                    ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-8 w-full" />)
                    : prochesRetraite.map((agent: any) => (
                        <div key={agent.id} className="flex items-center justify-between rounded bg-yellow-100 p-2 text-yellow-700">
                          <span>{agent.nom} {agent.prenom} ({agent.age} ans)</span>
                          <Button variant="outline" size="sm">Voir</Button>
                        </div>
                      ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {canValidateCarriere && (
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogContent>
                <DialogHeader><DialogTitle>Nouvelle decision RH</DialogTitle></DialogHeader>
                <form onSubmit={submitDecision} className="flex flex-col gap-4">
                  <select className="rounded border p-2" disabled={validating} value={formData.typeContrat} onChange={(e) => setFormData({ ...formData, typeContrat: e.target.value })}>
                    <option value="">-- Selectionnez le type de contrat --</option>
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="STAGE">Stage</option>
                    <option value="ALTERNANCE">Alternance</option>
                    <option value="INTERIM">Interim</option>
                  </select>
                  <Input type="date" disabled={validating} onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })} />
                  <Button type="submit" className="mt-2" disabled={validating}>{validating ? "Traitement..." : "Enregistrer"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </div>
  );
}
