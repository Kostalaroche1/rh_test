'use client'

// Gabriel code (Habacuk design + Gabriel logic for presence/demande conge)

import { useEffect, useState } from "react";
import { DollarSign, FileText, Gift } from "lucide-react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import Select from "react-select";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { useAgents } from "@/app/contexts/agents/context";
import { useDelete, useGet, usePost } from "@/hooks/useApi";
import { createPaie, deletePaie, getPaies } from "@/app/action/paie/action";
import { GetDashAgentAdmin } from "@/app/action/agent/dash/action";
import { ChartPaie } from "../../paie/chartPaie";
import { ChartPaieDate } from "@/services/chartPaie";
import { BulletinPDF } from "../../paie/bulletinPdf";
import { DataTable } from "../../tabord/tables/tableUser";
import { appReactSelectStyles, getSelectPortalTarget } from "@/components/ui/react-select-theme";
import RHPresences from "../../agent/presence/Rh";
import RhDemandeConge from "../../agent/conges/demande/RhDemandeConge";
import RhTypeConge from "../../agent/conges/RhConge";

const TAUX_RETENUE = 0.1;
const statutColor = (statut: any) => {
  if (statut === "PAYE") return "bg-emerald-500/18 text-emerald-500";
  if (statut === "EN_ATTENTE") return "bg-amber-500/18 text-amber-500";
  return "bg-muted text-muted-foreground";
};

export default function RHDashboard() {
  const selectThemeProps = {
    styles: appReactSelectStyles,
    menuPortalTarget: getSelectPortalTarget(),
    menuPosition: "fixed" as const,
  };

  const [openPaieDialog, setOpenPaieDialog] = useState(false);

  const [selectedPaie, setSelectedPaie] = useState<any>(null);
  const [agentFilter, setAgentFilter] = useState<any>(null);

  const { data: stats, isPending: isPendingStats } = useGet(["DashAgentAdmin"], GetDashAgentAdmin);

  const { isPendingAgents, agents, refetchAgents } = useAgents();
  const { data: paies = [], refetch: refetchPaies } = useGet(["PaieAll"], getPaies);

  const { mutate: payerAgent } = usePost(createPaie);
  const { mutate: supprimerPaie } = useDelete(deletePaie);

  const [form, setForm] = useState({
    agentId: "",
    periode: "",
    salaireBase: "",
    brut: "",
    net: ""
  });
  const [primes, setPrimes] = useState<any>([]);

  useEffect(() => {
    const salaireBase = Number(form.salaireBase) || 0;
    const totalPrimes = primes.reduce((acc: number, p: { montant: any; }) => acc + Number(p.montant || 0), 0);
    const brut = salaireBase + totalPrimes;
    const net = brut - brut * TAUX_RETENUE;
    setForm(f => ({ ...f, brut: brut.toFixed(2), net: net.toFixed(2) }));
  }, [form.salaireBase, primes]);

  const paiesFiltrees = agentFilter
    ? paies.filter((p: { agentId: any; }) => p.agentId === agentFilter)
    : paies;

  const chartData = ChartPaieDate(paiesFiltrees);

  const handleSubmitPaie = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    payerAgent({
      agentId: Number(form.agentId),
      periode: form.periode,
      salaireBase: Number(form.salaireBase),
      brut: Number(form.brut),
      net: Number(form.net),
      etat: "PAYE",
      primes
    }, {
      onSuccess: () => {
        setOpenPaieDialog(false);
        setForm({ agentId: "", periode: "", salaireBase: "", brut: "", net: "" });
        setPrimes([]);
        refetchPaies();
      }
    });
  };

  return (
    <div className="erp-page">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Espace Gestion RH</h1>
        <p className="text-muted-foreground">Bienvenue dans votre tableau de bord RH</p>
      </div>

      <Separator />

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-4 md :flex align-center">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="conges">Conges</TabsTrigger>
          <TabsTrigger value="presence">Presence</TabsTrigger>
          <TabsTrigger value="typesConge">Types de conge</TabsTrigger>
          <TabsTrigger value="bulletins">Bulletins</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="flex flex-col gap-6">
          {isPendingStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Skeleton className="p-8" /></div>
              <div><Skeleton className="p-8" /></div>
              <div><Skeleton className="p-8" /></div>
            </div>
          )}
          {!isPendingStats && stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="dashboard-stat-card dashboard-stat-tone-blue flex-1">
                <CardHeader><CardTitle>Total Agents</CardTitle></CardHeader>
                <CardContent><div className="dashboard-stat-value text-3xl">{agents ? agents.length : 0}</div></CardContent>
              </Card>
              <Card className="dashboard-stat-card dashboard-stat-tone-soft flex-1">
                <CardHeader><CardTitle>Demandes conges</CardTitle></CardHeader>
                <CardContent>
                  <div className="dashboard-stat-value text-3xl">{stats.demandeconges}</div>
                </CardContent>
              </Card>
              <Card className="dashboard-stat-card dashboard-stat-tone-sky flex-1">
                <CardHeader><CardTitle>Conges restants moyens</CardTitle></CardHeader>
                <CardContent><div className="dashboard-stat-value text-3xl">{stats.conges} jours</div></CardContent>
              </Card>
            </div>
          )}

          <Card className="erp-panel w-full">
            <CardHeader>
              <CardTitle>Evolution des salaires nets</CardTitle>
              <CardDescription>Par periode</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[200px]">
              {chartData ? (
                <ChartPaie chartData={chartData} />
              ) : (
                <p className="text-center text-sm text-muted-foreground py-12">Aucune donnee de paie a afficher</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents">
          <DataTable data={agents} isPending={isPendingAgents} onRefresh={refetchAgents} />
        </TabsContent>

        <TabsContent value="conges" className="flex flex-col gap-6">
          <RhDemandeConge />
        </TabsContent>

        <TabsContent value="presence">
          <RHPresences />
        </TabsContent>

        <TabsContent value="typesConge" className="flex flex-col gap-4">
          <RhTypeConge />
        </TabsContent>

        <TabsContent value="bulletins" className="flex flex-col gap-3">
          <div className="flex gap-2">
            {/* <Button variant="outline" onClick={() => setOpenPaieDialog(true)} className="w-full justify-start lg:w-1/4">
              <DollarSign className="w-5 h-5 mr-2" /> Payer un agent
            </Button> */}
            <PDFDownloadLink
              document={
                <BulletinPDF
                  paies={paies}
                  devise="$"
                  entreprise={{ nom: "RTNC", adresse: "Av. ...", ville: "Kinshasa", telephone: "+243..." }}
                />
              }
              fileName={`bulletin-${paies?.agent?.matricule || "agent"}.pdf`}
            >
              {({ loading }) => (
                <Button className="rounded-full" variant="outline" disabled={loading}>
                  {loading ? "Generation..." : "Exporter bulletin (PDF)"}
                </Button>
              )}
            </PDFDownloadLink>
          </div>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>Bulletins de paie</CardTitle>
              <CardDescription>Consulter et filtrer les bulletins</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Select
                options={agents.map((a: { compteAgent: { agent: { id: any; nom: any; }; }; }) => ({ value: a.compteAgent.agent.id, label: a.compteAgent.agent.nom }))}
                onChange={(opt: any) => setAgentFilter(opt?.value)}
                isClearable
                placeholder="Filtrer par agent"
                {...selectThemeProps}
              />

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Periode</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Net</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paiesFiltrees.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.datePaiement).toLocaleDateString()}</TableCell>
                      <TableCell>{p.agent?.nom}</TableCell>
                      <TableCell>${p.net}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded ${statutColor(p.etat)}`}>{p.etat}</span>
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button className="rounded-full" variant="outline" size="sm" onClick={() => setSelectedPaie(p)}>
                          <FileText className="w-4 h-4 mr-1" /> Voir
                        </Button>
                        {/* <Button className="rounded-full" variant="destructive" size="sm" onClick={() => supprimerPaie(p.id, { onSuccess: refetchPaies })}>
                          Supprimer
                        </Button> */}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={openPaieDialog} onOpenChange={setOpenPaieDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Payer un agent</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmitPaie}>
            <Select
              options={agents.map((a: {
                compteAgent: {
                  agent: {
                    matricule: any; id: any; nom: any;
                  };
                };
              }) => ({ value: a.compteAgent.agent.id, label: a.compteAgent.agent.matricule }))}
              onChange={(opt: any) => setForm({ ...form, agentId: opt?.value })}
              placeholder="Selectionner un agent"
              {...selectThemeProps}
            />
            <Input
              type="number"
              placeholder="Salaire de base"
              value={form.salaireBase}
              onChange={e => setForm({ ...form, salaireBase: e.target.value })}
            />

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Gift className="w-4 h-4" /> Primes
              </h4>
              {primes.map((p: any, i: number) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="Type"
                    value={p.type}
                    onChange={e => {
                      const copy = [...primes];
                      copy[i].type = e.target.value;
                      setPrimes(copy);
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Montant"
                    value={p.montant}
                    onChange={e => {
                      const copy = [...primes];
                      copy[i].montant = Number(e.target.value);
                      setPrimes(copy);
                    }}
                  />
                  <Button type="button" variant="destructive" onClick={() => setPrimes(primes.filter((_: any, idx: any) => idx !== i))}>×</Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => setPrimes([...primes, { type: "", montant: 0 }])}>+ Ajouter une prime</Button>
            </div>

            <Separator />

            <p><b>Brut :</b> ${form.brut}</p>
            <p><b>Net :</b> ${form.net}</p>

            <Button type="submit">
              <DollarSign className="w-4 h-4 mr-2" /> Payer
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Type conge managed in RhTypeConge component */}

      {selectedPaie && (
        <Dialog open onOpenChange={() => setSelectedPaie(null)}>
          <DialogContent style={{ maxWidth: "400px" }}>
            <DialogHeader>
              <DialogTitle>Bulletin de paie</DialogTitle>
            </DialogHeader>

            <div className="space-y-2 text-sm">
              <p><b>Agent :</b> {selectedPaie.agent?.nom}</p>
              <p><b>Période :</b> {new Date(selectedPaie.datePaiement).toLocaleDateString()}</p>
              <p><b>Salaire de base :</b> ${selectedPaie.salaireBase}</p>
              {/* <p><b>Primes :</b> {selectedPaie.primes.map((prime: any, idx: any) => (
                <p className="px-15" key={idx}>{prime.type} : {prime.montant}$</p>
              ))}</p> */}
              <div>
                <b>Primes :</b>
                {selectedPaie.primes.map((prime: any, idx: any) => (
                  <div key={idx} className="ml-4">
                    {prime.tag} {prime.type} : {prime.montant}$
                  </div>
                ))}
              </div>
              <p><b>Brut :</b> ${selectedPaie.brut}</p>
              <p><b>Net :</b> ${selectedPaie.net}</p>
            </div>

            <PDFDownloadLink
              document={<BulletinPDF paie={selectedPaie} entreprise={'RTNC'} devise="$" />}
              fileName={`bulletin-${selectedPaie.agent?.nom}.pdf`}
            >
              {({ loading }) => (
                <Button className="mt-4">
                  <FileText className="w-4 h-4 mr-2" />
                  {loading ? "Génération..." : "Télécharger PDF"}
                </Button>
              )}
            </PDFDownloadLink>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
