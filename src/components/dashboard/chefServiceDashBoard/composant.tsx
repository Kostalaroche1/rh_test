"use client"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Users, BarChart2, FileText, AlertCircle, CalendarCheck, BookOpen, Calendar, CheckCheck, Cross, CrossIcon } from "lucide-react";
import { TypeCongeList } from "./TabList";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useEffect, useState } from "react";
import { DemandeConge, emptyDemande, TypeConge } from "@/utilities/type";
import { formaDate } from "./TypeCongeSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AddConge, DeleteConge, GetVacance, UpdateTypeConge } from "@/app/action/conge/action";
import { AddDemandeConge, GetDemandeConge, UpdateDemandeConge } from "@/app/action/conge/demandeconge/action";
import { useGet } from "@/hooks/useApi";
import { GETAgentServices } from "@/app/action/carrieres/agents/action";
import { Skeleton } from "@/components/ui/skeleton";
import { GetDashAgentAdmin } from "@/app/action/agent/dash/action";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export default function ChefServiceDashboardUltra() {
   const [openNewConge, setOpenNewconge] = useState(false);
  const [openNewDemandeConge, setOpenNewDemandeConge] = useState(false);
  const [openNewModifyDemandeConge, setOpenNewModifyDemandeConge] = useState(false);

  const [demandes, setDemandes] = useState<DemandeConge[]>([])
  const [typeHolidays, setTypeHolidays] = useState<TypeConge[]>([])
  const [demande, setDemande] = useState<DemandeConge>(emptyDemande)
  // type congé state
  const [selectedType, setSelectedType] = useState<TypeConge | null>(null)
  const [openEditModal, setOpenEditModal] = useState(false)
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const {data: agentsServices , isPending , error , isLoading} = useGet(['AgentServices'],GETAgentServices)
  const {data: stats , isPending : isPendingStats} = useGet(['DashAgentAdmin'],GetDashAgentAdmin)
  
  // Données simulées
  // const agentsService = [
  //   { nom: "Karoles Ovono", poste: "Développeur", statut: "Actif", congésRestants: 12, formations: 2, projets: 3 },
  //   { nom: "Alice Dupont", poste: "Analyste", statut: "Actif", congésRestants: 8, formations: 1, projets: 2 },
  //   { nom: "Mohamed Ali", poste: "Designer", statut: "Absent", congésRestants: 5, formations: 0, projets: 1 },
  // ];

  const pieData = [
    { name: "Actif", value: stats ? stats.actif : 15, color: "#4ade80" },
    { name: "Absent", value: stats ? stats.absences : 3, color: "#f87171" },
    { name: "En congé", value: stats ? stats.enconges :  5, color: "#facc15" },
     { name: "present", value: stats ? stats.presences :  5, color: "#8d2562" },
  ];

  const barPerformance = [
    { mois: "Jan", performance: 80 },
    { mois: "Fév", performance: 95 },
    { mois: "Mar", performance: 70 },
    { mois: "Avr", performance: 90 },
  ];

  const statsCards = [
    { title: "Agents actifs", value: stats ? stats.actif : 0, tone: "dashboard-stat-tone-blue" },
    { title: "CongÃ©s restants totaux", value: `${stats ? stats.conges : 0} jours`, tone: "dashboard-stat-tone-soft" },
    { title: "PrÃ©sences", value: stats ? stats.presences : 0, tone: "dashboard-stat-tone-sky" },
    { title: "Demandes congÃ©s", value: stats ? stats.demandeconges : 0, tone: "dashboard-stat-tone-blue" },
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
    { message: "Absence non justifiée détectée", type: "warning" },
    { message: "Nouvelle formation disponible", type: "info" },
    { message: "Congé approché dépassé", type: "error" },
  ];

  
  const Reccordholiday = async (formData: FormData) => {
    // e.preventDefault()
    const code = formData.get("code")
    const libelle = formData.get("libelle")
    const dureeMax = formData.get("dureeMax")
    console.log(code, libelle, dureeMax, "code,libelle from action")
    const data: any = await AddConge({ code, libelle, dureeMax })
    if (!data.ok) {

    }
    await GetDemande()
    setOpenNewconge(false)
  }

  const GetDemande = async () => {
    const data = await GetDemandeConge()
    const typeCongeData = await GetVacance()
    setTypeHolidays(typeCongeData.getData)
    console.log(data.getData, "data inside getDemande", typeCongeData)
    setDemandes(data.getData)
  }

  const ReccordAskForHoliday = async (formData: FormData) => {

    const dateDebut = formData.get("dateDebut")
    const dateFin = formData.get("dateFin")
    const motif = formData.get("motif")
    const dateDemande = formData.get("dateDemande")
    const askConge = { dateDebut, dateFin, dateDemande, motif }
    const data = await AddDemandeConge(askConge)
    if (!data) {
      console.log(data, "formdata  nest recorAskfor holiday")
    }
    await GetDemande()
    setOpenNewDemandeConge(false)
  }
    useEffect(() => {
    const loadData = async () => {
      await GetDemande()
    }
    loadData()
  }, [])

  const handleAsKHoliday = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setDemande((demande) => (
      {
        ...demande,
        [name]: value
      }
    ))
  }

  const ModifyAskForHoliday = async () => {
    const data = await UpdateDemandeConge(demande)
    console.log(data , 'Update demande congé')
    if (!data) {
      console.log(data, "formdata  nest recordAskfor holiday")
    }
    console.log(data, "formdata  nest recordAskfor holiday")

    GetDemande()
    setOpenNewModifyDemandeConge(false)

  }

  const EditTypeConge = async (e: React.ChangeEvent<HTMLElement>) => {
    e.preventDefault()
    const data = await UpdateTypeConge(selectedType)
    console.log(data, 'data nest edit type conge before data verification')
    if (!data) {
      return console.log(data)
    }
    console.log(data, 'data nest edit type conge after')
    await GetDemande()
    setOpenEditModal(false)
  }
  const deleteTypeConge = async () => {
    try {
       const data = await DeleteConge({ id: selectedId })
       await GetDemande()
       setOpenDeleteConfirm(false)
    } catch (error) {
      
    }
  }

  return (
    <div className="erp-page">

      <div>
        <h1 className="text-3xl font-bold mb-1">Dashboard Chef de Service</h1>
        <p className="text-muted-foreground">Vue complète de votre service avec tous les indicateurs</p>
      </div>

      <Separator />

      <Tabs defaultValue="dashboard" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          {/* <TabsTrigger value="budget">Budget & KPIs</TabsTrigger> */}
          {/* <TabsTrigger value="conges">Congés</TabsTrigger> */}
          <TabsTrigger value="typeConge">Type Congé</TabsTrigger>
          <TabsTrigger value="demandeConge">Demande Congés</TabsTrigger>
          {/* <TabsTrigger value="performance">Performance</TabsTrigger> */}
          {/* <TabsTrigger value="alerts">Alertes</TabsTrigger> */}
          {/* <TabsTrigger value="formations">Formations</TabsTrigger> */}
        </TabsList>

         <TabsContent value="demandeConge">
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date début</TableHead>
                  <TableHead>Date fin</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demandes.map((demandeconge, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{demandeconge.agent.nom || null}</TableCell>
                    <TableCell>{demandeconge.typeConge.code || null}</TableCell>
                    <TableCell>{formaDate(demandeconge.dateDebut) || null}</TableCell>
                    <TableCell>{formaDate(demandeconge.dateFin) || null}</TableCell>
                    <TableCell>{demandeconge.statut || null}</TableCell>
                    <TableCell className="flex justify-end">
                      {demandeconge.statut =="VALIDE" || demandeconge.statut === "REJETE"?
                      ""
                      : 
                       <Button variant="outline" className="w-1/1.5 "
                        disabled={demandeconge.statut === "ok" ? true : false}
                        onClick={() => {
                          setOpenNewModifyDemandeConge(true)
                          setDemande({
                            dateDebut: demandeconge.dateDebut,
                            dateFin: demandeconge.dateFin,
                            dateDemande: demandeconge.dateDemande,
                            motif: demandeconge.motif,
                            id: demandeconge.id,
                            typeConge: demandeconge.typeConge,
                            statut: demandeconge.statut === "CONFIRME" ? "EN_ATTENTE" : "CONFIRME",
                            agent: demandeconge.agent,
                            role: "chefservice"
                          })
                        }}>
                         { demandeconge.statut.toLowerCase() === "confirme" ? <> <CheckCheck className="w-5/ h-5 mr-2 text-green-400" /> confirmée</>
                         :<> <CheckCheck className="w-5/ h-5 mr-2" />non confirmée</> }
                      </Button>
                      }
                     
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </TabsContent>

        <TabsContent value="typeConge">
          <CardHeader className="flex justify-between items-center mb-2">
            <CardTitle>Congés des agents</CardTitle>
            <Button variant="outline"  onClick={() => setOpenNewconge(true)} >
              <CrossIcon className="" /> Ajouter un congé
            </Button>
          </CardHeader>
          <Separator />
          <CardContent>
            <TypeCongeList
              typeConges={typeHolidays}
              onEdit={(type) => {
                setSelectedType(type)
                setOpenEditModal(true)
              }}
              onDelete={(id) => {
                setSelectedId(id)
                setOpenDeleteConfirm(true)
              }}
            />
            {/* </SelectContent>
              </Select> */}
          </CardContent>
        </TabsContent>

        {/* DASHBOARD SYNTHÈSE */}
        {isPendingStats && <Skeleton className="p-20"/>}
        <TabsContent value="dashboard" className="flex flex-col gap-6">
          
              {!isPending && stats &&
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
              <CardTitle>État des agents</CardTitle>
              <CardDescription>Actif, absent ou en congé</CardDescription>
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
               }
         

          {/* PIE CHART STATUT AGENTS */}
         
        </TabsContent>
        {/* AGENTS */}
<TabsContent value="agents">
  <Card>
    <CardHeader>
      <CardTitle>Agents du service</CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Poste</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Congés</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending && <Skeleton className={"w-full py-10"}/>}
          {!isPending && agentsServices && agentsServices?.map((agent : any, idx : any)  => (
            <TableRow key={idx}>
              <TableCell>{agent.nom}</TableCell>
              <TableCell>{agent.poste}</TableCell>
              <TableCell>{agent.statut}</TableCell>
              <TableCell>{agent.conges}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
</TabsContent>


        {/* BUDGET & KPIs */}
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

        {/* CONGES
        <TabsContent value="conges">
          <Card>
            <CardHeader>
              <CardTitle>Congés des agents</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date début</TableHead>
                    <TableHead>Date fin</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentsService.map((agent, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{agent.nom}</TableCell>
                      <TableCell>Congé annuel</TableCell>
                      <TableCell>2026-03-01</TableCell>
                      <TableCell>2026-03-05</TableCell>
                      <TableCell>Approuvé</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent> */}

        {/* PERFORMANCE */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance des agents</CardTitle>
              <CardDescription>Suivi des objectifs et KPI</CardDescription>
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

        {/* ALERTES */}
        <TabsContent value="alerts">
          <div className="grid gap-4 md:grid-cols-2">
            {alerts.map((alert, idx) => (
              <Card key={idx} className={`p-4 ${alert.type === "warning" ? "bg-yellow-100" : alert.type === "error" ? "bg-red-100" : "bg-blue-100"}`}>
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

        {/* FORMATIONS
        <TabsContent value="formations">
          <Card>
            <CardHeader>
              <CardTitle>Formations planifiées</CardTitle>
              <CardDescription>Suivi des formations par agent</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Formations terminées</TableHead>
                    <TableHead>Formations en cours</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentsService.map((agent, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{agent.nom}</TableCell>
                      <TableCell>{agent.formations}</TableCell>
                      <TableCell>{Math.max(0, 3 - agent.formations)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent> */}
      </Tabs>
          {/* form create conge */}
      <Dialog open={openNewConge} onOpenChange={setOpenNewconge}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ajouter un type de congé</DialogTitle>
          </DialogHeader>
          <form className="flex flex-col gap-4" action={Reccordholiday}>
            <Input placeholder="code congé" name="code" required />
            <Input placeholder="libelle congé" name="libelle" required />
            <Input placeholder="duree" type="number" name="dureeMax" required />
            <Button type="submit" className="mt-2">creer</Button>
          </form>
        </DialogContent>
      </Dialog>


      {/* form create askHoliday */}
      <Dialog open={openNewDemandeConge} onOpenChange={setOpenNewDemandeConge}>
        <DialogContent className="w-full max-w-lg">
          <DialogHeader>
            <DialogTitle>Faire une demande de congé</DialogTitle>
          </DialogHeader>

          <form className="flex flex-col gap-4" action={ReccordAskForHoliday}>

            {/* Dates début / fin */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dateDebut">Date de début</Label>
                <Input
                  id="dateDebut"
                  type="date"
                  name="dateDebut"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dateFin">Date de fin</Label>
                <Input
                  id="dateFin"
                  type="date"
                  name="dateFin"
                  required
                />
              </div>
            </div>

            {/* Date de demande */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dateDemande">Date de la demande</Label>
                <Input
                  id="dateDemande"
                  type="date"
                  name="dateDemande"
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-col gap-2">
                  <Label>Type de congé</Label>

                  <Select name="typeCongeId">
                    <SelectTrigger>
                      <SelectValue placeholder={demande.typeConge.libelle} />
                    </SelectTrigger>

                    <SelectContent>
                      {typeHolidays.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          {type.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {/* Motif */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="motif">Motif</Label>
              <Textarea
                id="motif"
                name="motif"
                placeholder="Raison de la demande de congé"
                className="min-h-[100px] resize-none"
                required
              />
            </div>

            <Button type="submit" className="mt-2 w-full sm:w-fit">
              Créer
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      {/* Handle  */}
      <Dialog open={openNewModifyDemandeConge} onOpenChange={setOpenNewModifyDemandeConge}>
        <DialogContent className="w-full max-w-lg">
           <DialogTitle>Messages</DialogTitle>
          <DialogHeader>
            <small> voulez-vous  {demande.statut === "ok" ? "accepter" : "rejeter"} une demande de congé de l'agent <strong>{demande.agent.nom}</strong> .
              si vous ne voulez pas executer cette action fermer la fenetre actuelle  </small>
          </DialogHeader>
          <div className="flex gap-2" >
            {/* Dates début / fin */}

            <Button type="submit" className="mt-2 w-full sm:w-fit"
              // disabled={}
              onClick={ModifyAskForHoliday}
            >
              confirmer
            </Button>
            <Button type="submit" variant={'destructive'} className="mt-2 w-full sm:w-fit"
              // disabled={}
              onClick={()=> setOpenNewModifyDemandeConge(false)}
            >
             Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* mODAL MODIFY (EDIT)TYPE CONGE */}
      <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier Type de Congé</DialogTitle>
          </DialogHeader>

          {selectedType && (
            <form
              onSubmit={EditTypeConge}
              className="flex flex-col gap-4"
            >
              <Input
                value={selectedType.code}
                onChange={(e) =>
                  setSelectedType({
                    ...selectedType,
                    code: e.target.value,
                  })
                }
              />

              <Input
                value={selectedType.libelle}
                onChange={(e) =>
                  setSelectedType({
                    ...selectedType,
                    libelle: e.target.value,
                  })
                }
              />

              <Input
                type="number"
                value={selectedType.dureeMax}
                onChange={(e) =>
                  setSelectedType({
                    ...selectedType,
                    dureeMax: Number(e.target.value),
                  })
                }
              />

              <Button type="submit">Valider</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOGUE */}
      <AlertDialog open={openDeleteConfirm} onOpenChange={setOpenDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer ce type de congé ?
            </AlertDialogTitle>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteTypeConge}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    
  );
}


