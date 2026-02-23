'use client'
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, PieChart, DollarSign, Gift } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Select from "react-select";
import { useAgents } from "@/app/contexts/agents/context";
import { useGet, usePost, useDelete } from "@/hooks/useApi";
import { getPaies, createPaie, deletePaie } from "@/app/action/paie/action";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { DataTable } from "../../tabord/tables/tableUser";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { BulletinPDF } from "../../paie/bulletinPdf";
import { ChartPaie } from "../../paie/chartPaie";
import { ChartPaieDate } from "@/services/chartPaie";
import { GetDemandeConge, UpdateDemandeConge } from "@/app/action/conge/demandeconge/action";
import { DemandeConge, emptyDemande, EmptyDemande, TypeConge } from "@/utilities/type";
import { toast } from "sonner";
import { GetDashAgentAdmin } from "@/app/action/agent/dash/action";
import { Skeleton } from "@/components/ui/skeleton";

/* ---------------- CONSTANTES ---------------- */
const TAUX_RETENUE = 0.1;
const statutColor = (statut :any) => {
  if (statut === "PAYE") return "bg-emerald-500/18 text-emerald-500";
  if (statut === "EN_ATTENTE") return "bg-amber-500/18 text-amber-500";
  return "bg-muted text-muted-foreground";
};

/* ---------------- COMPONENT ---------------- */
export default function RHDashboard() {
  const [openNewAgent, setOpenNewAgent] = useState(false);
  const [openNewConge, setOpenNewConge] = useState(false);
  const [openPaieDialog, setOpenPaieDialog] = useState(false);

  const [selectedPaie, setSelectedPaie] = useState  <any>(null);
  const [agentFilter, setAgentFilter] = useState<any>(null);

  const [openNewValidateHoliday, setOpenNewValidateHoliday] = useState(false);
  const [statutConge , setstatutConge] = useState('')
   const {data: stats , isPending : isPendingStats} = useGet(['DashAgentAdmin'],GetDashAgentAdmin)

  const [demandes, setDemandes] = useState<DemandeConge[]>([])
  const [typeHoliday, setTypeHoliday] = useState<TypeConge[]>([])
  const [demande, setDemande] = useState<any>(
    { id: 0,
      typeConge : {},
      agent: {},
      role: ""} )
  

    const getDemande = async () => {
    const data = await GetDemandeConge()
    console.log(data, "inside data RH")
    setDemandes(data.getData)
  }

  useEffect(() => {
    const holiday = async () => {
      await getDemande()
    }
    holiday()
  }, [])

async function approuverConge() {

  if (!demande?.id) {
     toast.warning("demande manquant") 
    
    return;
  }

   if (!statutConge) {
   toast.warning("statut manquant") 
    return;
  }

  const payload = {
    id: demande.id,
    role: demande.role,
    statut: statutConge
  };
  const data = await UpdateDemandeConge(payload);
  toast.info(data.message)

  setOpenNewValidateHoliday(false);
  await getDemande();
}

// KOSTA PRISMA 
  const [form, setForm] = useState({
    agentId: "",
    periode: "",
    salaireBase: "",
    brut: "",
    net: ""
  });
  const [primes, setPrimes] = useState<any>([]);

  const { isPendingAgents, agents, refetchAgents } = useAgents();
  const { data: paies = [], refetch: refetchPaies } = useGet(['PaieAll'], getPaies);

  const { mutate: payerAgent } = usePost(createPaie);
  const { mutate: supprimerPaie } = useDelete(deletePaie);

  /* -------- CALCUL BRUT / NET -------- */
  useEffect(() => {
    const salaireBase = Number(form.salaireBase) || 0;
    const totalPrimes = primes.reduce((acc: number, p: { montant: any; }) => acc + Number(p.montant || 0), 0);
    const brut = salaireBase + totalPrimes;
    const net = brut - brut * TAUX_RETENUE;
    setForm(f => ({ ...f, brut: brut.toFixed(2), net: net.toFixed(2) }));
  }, [form.salaireBase, primes]);

  /* -------- FILTRAGE DES BULLETINS -------- */
  const paiesFiltrees = agentFilter
    ? paies.filter((p: { agentId: any; }) => p.agentId === agentFilter)
    : paies;

    const chartData = ChartPaieDate(paiesFiltrees)

  /* -------- EXPORT PDF -------- */
  const exportPDF = async () => {
    if (!selectedPaie) return;
    const element = document.getElementById("bulletin-pdf");
    if (!element) return;
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    pdf.addImage(imgData, "PNG", 10, 10, 190, 0);
    pdf.save(`bulletin-${selectedPaie.agent?.nom}.pdf`);
  };

  /* -------- ACTION PAIEMENT -------- */
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

      {/* HEADER */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Espace Gestion RH</h1>
        <p className="text-muted-foreground">Bienvenue dans votre tableau de bord RH</p>
      </div>

      <Separator />

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="conges">Congés</TabsTrigger>
          <TabsTrigger value="bulletins">Bulletins</TabsTrigger>
          {/* <TabsTrigger value="rapports">Rapports</TabsTrigger> */}
        </TabsList>

        {/* DASHBOARD */}
    
<TabsContent value="dashboard" className="flex flex-col gap-6">
  {isPendingStats &&
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div>
          <Skeleton className="p-8"/>
    </div>
    <div>
          <Skeleton className="p-8"/>
    </div>
    <div>
          <Skeleton className="p-8"/>
    </div>
  </div>}
  {!isPendingStats && stats && 
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Card className="dashboard-stat-card dashboard-stat-tone-blue flex-1">
      <CardHeader><CardTitle>Total Agents</CardTitle></CardHeader>
      <CardContent><div className="dashboard-stat-value text-3xl">{agents? agents.length : 0}</div></CardContent>
    </Card>
    <Card className="dashboard-stat-card dashboard-stat-tone-soft flex-1">
      <CardHeader><CardTitle>Demandes congés</CardTitle></CardHeader>
      <CardContent>
        <div className="dashboard-stat-value text-3xl">{stats.demandeconges}</div>
      </CardContent>
    </Card>
    <Card className="dashboard-stat-card dashboard-stat-tone-sky flex-1">
      <CardHeader><CardTitle>Congés restants moyens</CardTitle></CardHeader>
      <CardContent><div className="dashboard-stat-value text-3xl">{stats.conges} jours</div></CardContent>
    </Card>
  </div>}
  

  {/* Graphique mini des salaires nets */}
  <Card className="erp-panel w-full">
    <CardHeader>
      <CardTitle>Évolution des salaires nets</CardTitle>
      <CardDescription>Par période</CardDescription>
    </CardHeader>
    <CardContent className="min-h-[200px]">
      {chartData ? (
        <ChartPaie chartData={chartData}/>
      ) : (
        <p className="text-center text-sm text-muted-foreground py-12">Aucune donnée de paie à afficher</p>
      )}
    </CardContent>
  </Card>
</TabsContent>


        {/* AGENTS */}
           <TabsContent value="agents">
                  <DataTable data={agents} isPending={isPendingAgents} onRefresh={refetchAgents} />
                </TabsContent>

        {/* CONGÉS */}
        <TabsContent value="conges" className="flex flex-col gap-6">
          {/* <Button variant="outline" onClick={() => setOpenNewConge(true)} className="w-1/4 justify-start">
            <Calendar className="w-5 h-5 mr-2" /> Nouvelle demande
          </Button> */}
          <Card className="w-full">
            <CardHeader><CardTitle>Demandes de congé</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Date début</TableHead>
                    <TableHead>Date fin</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demandes.map((d, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{d.agent.nom.toString()}</TableCell>
                      <TableCell>{ new Date(d.dateDebut).toLocaleDateString()}</TableCell>
                      <TableCell>{ new Date(d.dateFin).toLocaleDateString() }</TableCell>
                      <TableCell>{d.typeConge.nom}</TableCell>
                      <TableCell>{d.statut}</TableCell>
                      <TableCell>
                       { d.statut === "VALIDE" || d.statut==="REJETE" ?
                       ""
                       :
                        <Button variant="outline" size="sm"
                          disabled={d.statut === "VALIDE"}
                          onClick={() => {
                            setOpenNewValidateHoliday(true)
                            setDemande({ ...demande,
                              id: d.id,
                              typeConge : d.typeConge,
                              agent: d.agent,
                              role: "RH"
                            })
                          }}
                        >Actions</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BULLETINS */}
        <TabsContent value="bulletins" className="flex flex-col gap-3">
          <div className="flex gap-2">
             <Button variant="outline" onClick={() => setOpenPaieDialog(true)} className="w-full justify-start lg:w-1/4">
            <DollarSign className="w-5 h-5 mr-2" /> Payer un agent
          </Button>
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
      {loading ? "Génération..." : "Exporter bulletin (PDF)"}
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
                options={agents.map((a: { compteAgent: { agent: { id: any; nom: any;  }; }; }) => ({ value: a.compteAgent.agent.id, label: a.compteAgent.agent.nom }))}
                onChange={opt => setAgentFilter(opt?.value)}
                isClearable
                placeholder="Filtrer par agent"
              />
             
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Période</TableHead>
                    <TableHead>Agent</TableHead>
                    <TableHead>Net</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paiesFiltrees.map((p:any) => (
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
                        <Button className="rounded-full" variant="destructive" size="sm" onClick={() => supprimerPaie(p.id, { onSuccess: refetchPaies })}>
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG PAIEMENT */}
      <Dialog open={openPaieDialog} onOpenChange={setOpenPaieDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Payer un agent</DialogTitle></DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmitPaie}>
            <Select
              options={agents.map((a: { compteAgent: { agent: {
                matricule: any; id: any; nom: any; 
}; }; }) => ({ value: a.compteAgent.agent.id, label: a.compteAgent.agent.matricule }))}
              onChange={opt => setForm({ ...form, agentId: opt?.value })}
              placeholder="Sélectionner un agent"
            />
            <Input
              type="number"
              placeholder="Salaire de base"
              value={form.salaireBase}
              onChange={e => setForm({ ...form, salaireBase: e.target.value })}
            />

            {/* PRIMES */}
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Gift className="w-4 h-4" /> Primes
              </h4>
              {primes.map((p, i) : any => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder="Type"
                    value={p.type }
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
                  <Button type="button" variant="destructive" onClick={() => setPrimes(primes.filter((_: any, idx: any) => idx !== i))}>✕</Button>
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

      {/* DIALOG BULLETIN */}
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
             <p><b>Primes :</b>{selectedPaie?.primes?.map((prime : any , idx : any)=>(
              <strong className="px-15" key={idx}>{prime.type} : {prime.montant}$</strong>
             ))}</p>
             <p><b>Brut :</b> ${selectedPaie.brut}</p>
             <p><b>Net :</b> ${selectedPaie.net}</p>
           </div>
     
          <PDFDownloadLink
  document={
    <BulletinPDF
      paie={selectedPaie}
      devise="$"
     entreprise={{ nom: "RTNC", adresse: "Av. ...", ville: "Kinshasa", telephone: "+243..." }}
    />
  }
  fileName={`bulletin-${paies?.agent?.matricule || "agent"}.pdf`}
>
  {({ loading }) => (
    <Button variant="outline" disabled={loading}>
      {loading ? "Génération..." : "Exporter bulletin (PDF)"}
    </Button>
  )}
</PDFDownloadLink>
         </DialogContent>
       </Dialog>
     )}
      {/* DIALOG  APROUVER NOUVELLE DEMANDE DE CONGÉ */}
      <Dialog open={openNewValidateHoliday} onOpenChange={setOpenNewValidateHoliday}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>demande de congé</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4" >
            <small> Etes-vous sûr de valider ou rejeter la demande de congé de <strong>{demande.agent.nom}</strong> </small>
            <div className="flex gap-2">
              <Button type="submit" className="mt-2" onClick={()=>{
                setstatutConge("VALIDE")
                approuverConge()
              }}>Valider</Button>
               <Button type="submit" variant={'outline'} className="mt-2" onClick={()=>{
                setstatutConge("REJETE")
                approuverConge()
              }}>Rejeter</Button>
                <Button type="submit" variant={'destructive'} className="mt-2" onClick={()=> setOpenNewValidateHoliday(false)}>close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}


