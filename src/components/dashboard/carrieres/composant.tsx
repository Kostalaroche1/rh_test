'use client'
import { useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Users, Award } from "lucide-react";
import { GetAgentsForCarriere, GetAgentsProchesRetraite, ValidationCarriere } from "@/app/action/carrieres/agents/action";
import { useGet, usePost, usePut } from "@/hooks/useApi";
import { CreateAffectation, GetAffectations } from "@/app/action/affectations/action";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
// Skeleton simple
const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-muted rounded ${className || "h-6 w-full"}`}></div>
);

const statutColor = (statut: string) => {
  switch(statut){
    case "Approuvé": return "bg-green-100 text-green-700";
    case "En attente": return "bg-amber-500/20 text-amber-500";
    case "Refusé": return "bg-red-100 text-red-700";
    default: return "bg-muted text-muted-foreground";
  }
}

export default function GestionCarriere() {
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    id: 0, 
    agentId: 0, //ID AFFECTATION
    dateFin: "",
    motif: "",
    statut : "",
    typeContrat: "",
    statutContrat: ""
  });

  // ✅ Fetch des données
  const { data: agentsRaw = [], isPending: loadingAgents , refetch : refetchCarriere } = useGet(['agentsCarriere'], GetAgentsForCarriere);
  const { data: carrieresRaw = [], isPending: loadingCarrieres ,refetch : refetchCarriereAff} = useGet(['carrieres'], GetAffectations);
  const { data: prochesRetraiteRaw = [], isPending: loadingRetraite } = useGet(['prochesRetraite'], GetAgentsProchesRetraite);
  const agents = Array.isArray(agentsRaw) ? (agentsRaw as any[]) : [];
  const carrieres = Array.isArray(carrieresRaw) ? (carrieresRaw as any[]) : [];
  const prochesRetraite = Array.isArray(prochesRetraiteRaw) ? (prochesRetraiteRaw as any[]) : [];

  // ✅ Mutation pour créer une décision
  const {mutateAsync : CreateValidation , isPending : isPendingValidation} = usePut(ValidationCarriere);

  // ✅ Jauges calculées avec useMemo
  const totalAgents = useMemo(() => agents.length, [agents]);
  const agentsActifs = useMemo(() => agents.filter(a => a.actif).length, [agents]);
  const agentsProchesRetraiteCount = useMemo(() => prochesRetraite.length, [prochesRetraite]);
  const decisionsEnAttente = useMemo(() => carrieres.filter(c => c.statut === "EN_ATTENTE").length, [carrieres]);
  const [agentId ,  setAgentId] = useState(0)
  // ✅ Submit formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if(!formData.agentId || !formData.dateFin)
    {
      toast.warning("Veuillez entrée la date de fin d'affection et l'agent concerné")
      return ;
    }

    const responses = await CreateValidation(formData);
    toast.info(responses.status === 200 ? "Affectation approuvez avec success" : "Echec d'approbation")
    refetchCarriere()
    refetchCarriereAff()

    setOpenDialog(false);
    setFormData({
      id : 0, 
      agentId: 0, //ID AFFECTATIONS
      dateFin: "",
      motif: "",
      statut : "",
      typeContrat: "",
      statutContrat: ""
    });
  };

  function openForm(): void {
    setOpenDialog(true);
  }

  async function confirmREJETE(): Promise<void> {
    
      if(!formData.agentId )
    {
      toast.warning("Veuillez entrée la date de fin d'affection et l'agent concerné")
      return ;
    }

    const responses = await CreateValidation(formData);
    toast.info(responses.status === 200 ? "Affectation Rejeter avec success" : "Echec d'annulation")
    refetchCarriere()
    refetchCarriereAff()

    setOpenDialog(false);
    setFormData({
      id : 0, 
      agentId: 0, //ID AFFECTATIONS
      dateFin: "",
      motif: "",
      statut : "",
      typeContrat: "",
      statutContrat: ""
    });
    console.log("Function not implemented.");
  }

  return (
    <div className="erp-page">
      {/* HEADER */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Tableau de Bord</h1>
        <p className="text-muted-foreground">Suivi complet des agents, carrières et décisions</p>
      </div>

      <Separator />

      {/* JAUges / INDICATEURS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dashboard-stat-card dashboard-stat-tone-blue py-4">
          <CardHeader className="gap-1 px-4 pb-2">
            <p className="dashboard-stat-title">Agents totaux</p>
            <CardTitle className="dashboard-stat-value text-3xl">
              {loadingAgents ? <Skeleton className="h-8 w-16" /> : totalAgents}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0">
            <p className="text-xs text-muted-foreground">Suivi global des effectifs</p>
          </CardContent>
        </Card>
        <Card className="dashboard-stat-card dashboard-stat-tone-sky py-4">
          <CardHeader className="gap-1 px-4 pb-2">
            <p className="dashboard-stat-title">Agents actifs</p>
            <CardTitle className="dashboard-stat-value text-3xl">
              {loadingAgents ? <Skeleton className="h-8 w-16" /> : agentsActifs}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0">
            <p className="text-xs text-muted-foreground">Population actuellement active</p>
          </CardContent>
        </Card>
        <Card className="dashboard-stat-card dashboard-stat-tone-red py-4">
          <CardHeader className="gap-1 px-4 pb-2">
            <p className="dashboard-stat-title">Proches de la retraite</p>
            <CardTitle className="dashboard-stat-value text-3xl">
              {loadingRetraite ? <Skeleton className="h-8 w-16" /> : agentsProchesRetraiteCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0">
            <p className="text-xs text-muted-foreground">Anticipation des dÃ©parts</p>
          </CardContent>
        </Card>
        <Card className="dashboard-stat-card dashboard-stat-tone-soft py-4">
          <CardHeader className="gap-1 px-4 pb-2">
            <p className="dashboard-stat-title">Décisions en attente</p>
            <CardTitle className="dashboard-stat-value text-3xl">
              {loadingCarrieres ? <Skeleton className="h-8 w-16" /> : decisionsEnAttente}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0">
            <p className="text-xs text-muted-foreground">Dossiers à traiter</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="agents" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="carriere">Carrière & Décisions</TabsTrigger>
          <TabsTrigger value="retraite">Retraite</TabsTrigger>
        </TabsList>

       {/* TAB AGENTS */}
<TabsContent value="agents">
  <Card className="w-full">
    <CardHeader>
      <CardTitle>Liste des agents</CardTitle>
    </CardHeader>
    <CardContent className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
                <TableHead>Genre</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Date d'entrée</TableHead>
            <TableHead>Département</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>Service/Poste</TableHead>
            <TableHead>Age</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loadingAgents
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="hover:bg-muted/50">
                  <TableCell><Skeleton /></TableCell>
                  <TableCell><Skeleton className="w-16" /></TableCell>
                  <TableCell><Skeleton className="w-20" /></TableCell>
                  <TableCell><Skeleton className="w-24" /></TableCell>
                  <TableCell><Skeleton className="w-24" /></TableCell>
                  <TableCell><Skeleton className="w-28" /></TableCell>
                  <TableCell><Skeleton className="w-12" /></TableCell>
                </TableRow>
              ))
            : agents.map((agent : any) => {
                const lastAff = agent.affectations?.[agent.affectations.length - 1]
                const age = agent.datenais
                  ? Math.floor((new Date().getTime() - new Date(agent.datenais).getTime()) / (1000 * 60 * 60 * 24 * 365))
                  : "...";
                return (
                  <TableRow key={agent.id} className="hover:bg-muted/50">
                    <TableCell>{agent.nom} {agent.prenom}</TableCell>
                       <TableCell>{agent.genre} </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                        agent.actif ? "bg-emerald-500/18 text-emerald-500" : "bg-rose-500/18 text-rose-500"
                      }`}>
                        {agent.actif ? "Actif" : "Inactif"}
                      </span>
                    </TableCell>
                    <TableCell>{agent.dateEntree ? new Date(agent.dateEntree).toLocaleDateString() : "..."}</TableCell>
                    <TableCell>{lastAff?.departement?.nom || "..."}</TableCell>
                    <TableCell>{lastAff?.site?.nom || "..."}</TableCell>
                    <TableCell>{lastAff?.poste?.libelle || "..."}</TableCell>
                    <TableCell>{age}</TableCell>
                  </TableRow>
                )
              })}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</TabsContent>


        {/* TAB CARRIERE */}
        <TabsContent value="carriere" className="flex flex-col gap-4">
          {/* <Button variant="outline" className="w-1/5 justify-start" onClick={() => setOpenDialog(true)}>
            <Award className="w-5 h-5 mr-2" /> Ajouter une décision
          </Button> */}
          <Card className="w-full">
            <CardHeader><CardTitle>Décisions RH</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingCarrieres ? Array.from({length:5}).map((_,i) => (
                    <TableRow key={i} className="hover:bg-muted/50">
                      <TableCell><Skeleton /></TableCell>
                      <TableCell><Skeleton className="w-16" /></TableCell>
                      <TableCell><Skeleton className="w-20" /></TableCell>
                      <TableCell><Skeleton className="w-16" /></TableCell>
                    </TableRow>
                  )) : carrieres.map(c => (
                    <TableRow key={c.id} className="hover:bg-muted/50">
                      <TableCell>{c.agent.nom} {c.agent.prenom}</TableCell>
                      <TableCell>{c.type}</TableCell>
                      <TableCell>{new Date(c.dateDebut).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-sm font-medium ${statutColor(c.agent.actif)}`}>
                          {c.statut }
                        </span>
                      </TableCell>
                       <TableCell>
                       <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">Actions</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>

                    <DropdownMenuItem onClick={() => {
                      formData.statut = "VALIDE"
                        formData.agentId = parseInt(c.id)
                      openForm()
                      }}>Approuvé</DropdownMenuItem>

                      <DropdownMenuItem onClick={() => {
                        formData.statut = "REJETE"
                        formData.agentId = parseInt(c.id)
                         confirmREJETE()
                        }}>Rejete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                      </TableCell>
                        
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB RETRAITE */}
        <TabsContent value="retraite">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Agents proches de la retraite</CardTitle>
              <CardDescription>Agents ayant 60 ans ou plus</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {loadingRetraite ? Array.from({length:3}).map((_,i) => (
                <Skeleton key={i} className="h-8 w-full" />
              )) : prochesRetraite.map((a : any) => (
                <div key={a.id} className="flex justify-between items-center p-2 rounded bg-yellow-100 text-yellow-700">
                  <span>{a.nom} {a.prenom} ({a.age} ans)</span>
                  <Button variant="outline" size="sm">Voir</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG */}
 {/* DIALOGUE DE DÉCISION */}
<Dialog open={openDialog} onOpenChange={setOpenDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Nouvelle décision RH</DialogTitle>
    </DialogHeader>
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Type de contrat */}
      <select
        className="border p-2 rounded"
        disabled={isPendingValidation}
        value={formData.typeContrat}
        onChange={e => setFormData({...formData, typeContrat: e.target.value})}
      >
        <option value="">-- Sélectionnez le type de contrat --</option>
        <option value="CDI">CDI</option>
        <option value="CDD">CDD</option>
        <option value="STAGE">Stage</option>
        <option value="ALTERNANCE">Alternance</option>
        <option value="INTERIM">Intérim</option>
      </select>
      {/* Date début */}
      <Input
        type="date"
        disabled={isPendingValidation}
        onChange={e => setFormData({...formData, dateFin: e.target.value})}
      />

      <Button type="submit" className="mt-2" disabled={isPendingValidation}>{isPendingValidation ? 'loading...' : 'Enregistrer'}</Button>
    </form>
  </DialogContent>
</Dialog>


    </div>
  );
}

