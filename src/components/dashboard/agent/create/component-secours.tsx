'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, FileText, Download, BarChart2, Trash2, Calendar, Pencil } from "lucide-react"
import SectionCardAgents from '../cardAgents/sectionCardAgent'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"


import jsPDF from "jspdf"
import "jspdf-autotable"

import { BarChart, CartesianGrid, XAxis, YAxis, Bar } from "recharts"
import { useAuth } from "@/app/contexts/auth/context"
import { getPaiesByAgent } from "@/app/action/paie/getPaiesByAgents/action"
import { useGet, useGet_ } from "@/hooks/useApi"
import { BulletinPDF } from "../../paie/bulletinPdf"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { AddDemandeConge, DeletDemandeConge, GetDemandeConge, UpdateDemandeConge } from "@/app/action/conge/demandeconge/action"
import AgentDashPresence from "../presence/PresenceAgent"
import { DemandeConge, emptyDemande, TypeConge } from "@/utilities/type"
import { GetVacance } from "@/app/action/conge/action"
import { formaDate, TypeCongeSelect } from "../../chefServiceDashBoard/TypeCongeSelect"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { GetDashAgent } from "@/app/action/agent/dash/action"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"


export default function AgentDashboard() {
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedBulletin, setSelectedBulletin] = useState<any>(null)
  const [bulletins, setBulletins] = useState<any[]>([])

  const { auth, setAuth, isPending }: any = useAuth() // Agent connecté

  const [openNewDemandeConge, setOpenNewDemandeConge] = useState(false);
  const [openNewModifyDemandeConge, setOpenNewModifyDemandeConge] = useState(false);
  const [openNewDeleteDemandeConge, setOpenNewDeleteDemandeConge] = useState(false);
  const [demandes, setDemandes] = useState<any[]>([])
  const [typeHoliday, setTypeHoliday] = useState<TypeConge[]>([])
  const [demande, setDemande] = useState<DemandeConge>(emptyDemande)
  const { data: stats = [], isPending: isPendingDash } = useGet(['agentDash'], GetDashAgent)
  useEffect(() => { console.log(stats, "statistiques") }, [stats])

  const GetDemande = async () => {

    const data = await GetDemandeConge()
    const typeCongeData = await GetVacance()
    setTypeHoliday(typeCongeData.getData.reverse())
    console.log(data.getData, "data inside getDemande composant", typeCongeData)
    setDemandes(data.getData.reverse())

  }

  useEffect(() => {
    const loadData = async () => {
      await GetDemande()
    }

    loadData()
  }, [])


  const ReccordAskForHoliday = async (formData: FormData) => {

    const dateDebut = formData.get("dateDebut")
    const dateFin = formData.get("dateFin")
    const motif = formData.get("motif")
    const dateDemande = formData.get("dateDemande")
    const typeCongeId = formData.get("typeCongeId")
    const askConge = { dateDebut, dateFin, dateDemande, motif, typeCongeId }
    console.log(typeCongeId, "formdata  nest recorAskfor holiday", formData)

    if (!typeCongeId) {
      return alert("vous devez choisir type congé")
    }
    const data = await AddDemandeConge(askConge)
    if (!data) {
      return
    }
    await GetDemandeConge()
    setOpenNewDemandeConge(false)

  }

  const handleAsKHoliday = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setDemande((demande: any) => (
      {
        ...demande,
        [name]: value
      }
    ))
  }

  const ModifyAskForHoliday = async (e: React.ChangeEvent) => {
    e.preventDefault()
    alert("here it is")
    const data = await UpdateDemandeConge(demande)
    if (!data) {
      console.log(data, "formdata  nest recordAskfor holiday")
    }
    console.log(data, "formdata  nest recordAskfor holiday")

    GetDemande()
    setOpenNewModifyDemandeConge(false)

  }

  const deleteAskHoliday = async () => {

    const data = await DeletDemandeConge(demande)

    console.log(data)
    if (!data) {
      return "wrong"
    }
    await GetDemande()
    setOpenNewDeleteDemandeConge(false)

  }

  useEffect(() => {
    const loadData = async () => {
      await GetDemande()
    }
    loadData()
  }, [])
  // Récupère les bulletins de l'agent
  useEffect(() => {
    console.log(auth?.userId, 'ID AGENT DANS LE COMPOSANT')
    if (auth?.userId) {
      getPaiesByAgent(auth.userId).then((data: any[]) => setBulletins(data))
    }
  }, [auth])

  // const demandes = [
  //   { start: "2026-03-01", end: "2026-03-05", type: "Congé annuel", status: "Approuvé" },
  //   { start: "2026-04-10", end: "2026-04-12", type: "Congé maladie", status: "En attente" },
  //   { start: "2026-05-05", end: "2026-05-06", type: "Congé exceptionnel", status: "Refusé" },
  // ]

  // Calcul brut et net automatiquement
  const calculateTotals = (bulletin: any) => {
    const totalPrimes = bulletin.primes?.reduce((acc: number, p: any) => acc + Number(p.montant), 0) || 0
    const brut = Number(bulletin.salaireBase) + totalPrimes
    const net = brut * 0.8 // exemple déduction 20% charges
    return { totalPrimes, brut, net }
  }

  // PDF complet
  const generatePDF = () => {
    const bulletin = selectedBulletin
    if (bulletin) {
      console.log(selectedBulletin, "Bulletin de paie")
      BulletinPDF(selectedBulletin)

    }
  }

  // Préparer les données pour le graphique
  const chartData = bulletins.map(b => ({ periode: new Date(b.datePaiement).toLocaleString(), net: calculateTotals(b).net }))
  const chartDataAg = [
    { name: "Présences", nbres: stats ? stats.presences : 0, fill: "#22c55e" },
    { name: "Absences", nbres: stats ? stats.absences : 0, fill: "#ef4444" },
  ];

  const presenceChartConfig = {
    nbres: {
      label: "Total",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig;

  const agentStatsCards = [
    { title: "Congés restants", value: `${stats?.conges ?? 0} jours`, tone: "dashboard-stat-tone-soft" },
    { title: "Congés demandés", value: stats?.demandeconges ?? 0, tone: "dashboard-stat-tone-blue" },
  ];




  return (
    <div className="erp-page">
      {/* HEADER */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Espace Agent</h1>
        <p className="text-muted-foreground">Bienvenue sur votre tableau de bord</p>
      </div>

      <Separator />

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="conges">Congés</TabsTrigger>
          <TabsTrigger value="bulletins">Bulletins</TabsTrigger>
          <TabsTrigger value="presence">presence</TabsTrigger>
        </TabsList>
        {/* CONGÉS */}
        <TabsContent value="conges" className="flex flex-col gap-6 justify-end">

          <div className="flex gap-4">

            <Button variant="outline" className="w-full sm:w-1/2 lg:w-1/4" onClick={() => setOpenNewDemandeConge(true)}>
              <Calendar className="w-5 h-5 mr-2" />Nouvelle Demande Congé
            </Button>
          </div>
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Demandes de congé</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow >
                    <TableHead>Nom</TableHead>
                    <TableHead>Date de début</TableHead>
                    <TableHead>Date de fin</TableHead>
                    <TableHead>Type de congé</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demandes.map((demande, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/50" >
                      <TableCell>{demande.agent.nom}</TableCell>
                      <TableCell>{formaDate(demande.dateDebut)}</TableCell>
                      <TableCell>{formaDate(demande.dateFin)}</TableCell>
                      <TableCell>{demande.typeConge.libelle}</TableCell>
                      <TableCell> <Badge variant={demande.statut === 'VALIDE' || demande.statut === 'CONFIRME' ? 'secondary' : 'destructive'}>{demande.statut}</Badge> </TableCell>
                      <TableCell className="flex items-center gap-2 justify-end">
                        {!(demande.statut !== 'VALIDE' || demande.statut !== 'REJETE')
                          ?
                          <>
                            <Button variant="outline" size="sm" disabled={demande.statut === "ok" ? true : false}

                              onClick={() => {
                                setOpenNewModifyDemandeConge(true)
                                console.log(typeHoliday, "type holiday iside modify button")
                                setDemande({
                                  dateDebut: demande.dateDebut,
                                  dateFin: demande.dateFin,
                                  dateDemande: demande.dateDemande,
                                  motif: demande.motif,
                                  id: demande.id,
                                  typeConge: demande.typeConge,
                                  statut: demande.statut,
                                  agent: demande.agent,
                                  role: "agent"
                                })
                              }}
                            >modifier <Pencil className="w-4 h-4" /></Button>
                            <Button variant="outline" size="sm"
                              disabled={demande.statut === "ok" ? true : false}
                              onClick={() => {
                                setOpenNewDeleteDemandeConge(true)
                                console.log(typeHoliday, "type holiday iside modify button")
                                setDemande({
                                  dateDebut: demande.dateDebut,
                                  dateFin: demande.dateFin,
                                  dateDemande: demande.dateDemande,
                                  motif: demande.motif,
                                  id: demande.id,
                                  typeConge: demande.typeConge,
                                  statut: demande.statut,
                                  agent: demande.agent,
                                  role: "agent"
                                })
                              }}
                            >delete  <Trash2 className="w-4 h-4" /></Button>
                          </>
                          :
                          "--"
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="presence" className="flex">
          <AgentDashPresence />
        </TabsContent>

        {/* DASHBOARD */}
        <TabsContent value="dashboard" className="flex flex-col gap-6">
          {isPendingDash && <Skeleton className="w-full p-20" />}
          {!isPendingDash && stats &&
            <div className="flex flex-col gap-6">
              <div className="grid gap-4 md:grid-cols-2">
                {agentStatsCards.map((item) => (
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
              {/* Chart des présences */}
              <Card className="w-full min-h-[400px] border border-border bg-card py-4 shadow-sm">
                <CardHeader className="px-4 pb-2">
                  <CardTitle>Statistiques de présence</CardTitle>
                  <CardDescription>
                    Visualisation du nombre d'absences, présences
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] px-4 pt-0">
                  <ChartContainer config={presenceChartConfig} className="h-full w-full">
                    <BarChart data={chartDataAg} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="nbres" fill="var(--color-nbres)" radius={8} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>}
        </TabsContent>
        {/* BULLETINS */}
        <TabsContent value="bulletins" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulletins de paie</CardTitle>
              <CardDescription>Consulter vos bulletins et suivre l’évolution</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {bulletins.length ? (
                bulletins.map((b) => (
                  <Button
                    key={b.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setSelectedBulletin(b)}
                  >
                    <FileText className="w-5 h-5 mr-2" /> {new Date(b.datePaiement).toLocaleString()}
                  </Button>
                ))
              ) : (
                <p className="text-center text-muted-foreground">Aucun bulletin disponible</p>
              )}

              {/* GRAPHIQUE ÉVOLUTION NET */}
              {chartData.length > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Évolution du salaire net</CardTitle>
                  </CardHeader>
                  <CardContent className="h-60">
                    <ChartContainer config={presenceChartConfig} className="h-full w-full">
                      <BarChart data={chartDataAg} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="nbres" fill="var(--color-nbres)" radius={8} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>


      {/* DIALOG BULLETIN */}
      {selectedBulletin && (
        <Dialog open onOpenChange={() => setSelectedBulletin(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulletin de paie</DialogTitle>
            </DialogHeader>

            <div className="space-y-2 text-sm">
              <p><b>Période :</b> {new Date(selectedBulletin.datePaiement).toLocaleString()}</p>
              <p><b>Salaire de base :</b> ${selectedBulletin.salaireBase}</p>
              {(selectedBulletin.primes || []).map((p: any, idx: number) => (
                <p key={idx}><b>{p.nom} :</b> ${p.montant}</p>
              ))}
              <p><b>Brut :</b> ${calculateTotals(selectedBulletin).brut}</p>
              <p><b>Net à payer :</b> ${calculateTotals(selectedBulletin).net}</p>
            </div>
            <PDFDownloadLink
              document={<BulletinPDF paie={selectedBulletin} />}
              fileName={`bulletin-${selectedBulletin.agent?.nom}.pdf`}
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

      {/* DIALOG NOUVELLE DEMANDE
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle demande de congé</DialogTitle>
          </DialogHeader>
          <form className="flex flex-col gap-4">
            <input type="date" className="border p-2 rounded" placeholder="Date de début" />
            <input type="date" className="border p-2 rounded" placeholder="Date de fin" />
            <select className="border p-2 rounded">
              <option>Congé annuel</option>
              <option>Congé maladie</option>
              <option>Congé exceptionnel</option>
            </select>
            <Button type="submit" className="mt-2">Créer</Button>
          </form>
        </DialogContent>
      </Dialog> */}
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
                      {typeHoliday.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          {type.libelle}
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
      {/* modify AskHoliday */}
      <Dialog open={openNewModifyDemandeConge} onOpenChange={setOpenNewModifyDemandeConge}>
        <DialogContent className="w-full max-w-lg">
          <DialogHeader>
            <DialogTitle>modifier  une demande de congé</DialogTitle>
          </DialogHeader>

          <form className="flex flex-col gap-4" onSubmit={ModifyAskForHoliday}>

            {/* Dates début / fin */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dateDebut">Date de début</Label>
                <Input
                  id="dateDebut"
                  type="date"
                  name="dateDebut"
                  value={formaDate(demande.dateDebut)}
                  onChange={handleAsKHoliday}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dateFin">Date de fin</Label>
                <Input
                  id="dateFin"
                  type="date"
                  name="dateFin"
                  value={formaDate(demande.dateFin)}
                  onChange={handleAsKHoliday}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* Date de demande */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="dateDemande">Date de la demande</Label>
                <Input
                  id="dateDemande"
                  type="date"
                  name="dateDemande"
                  value={formaDate(demande.dateDemande)}
                  onChange={handleAsKHoliday}
                  required
                />
              </div>
              <div>
                {/* <TypeCongeSelect typeConges={typeHoliday} /> */}
                <TypeCongeSelect
                  typeConges={typeHoliday}
                  value={demande?.typeConge.id}
                  onChange={(type) => {
                    setDemande((prev) =>
                      prev
                        ? {
                          ...prev,
                          typeConge: type,
                        }
                        : prev
                    )
                  }}
                />

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
                value={demande.motif}
                onChange={handleAsKHoliday}
                required
              />
            </div>

            <Button type="submit" className="mt-2 w-full sm:w-fit">
              modifier
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/*  */}
      <Dialog open={openNewDeleteDemandeConge} onOpenChange={setOpenNewDeleteDemandeConge}>
        <DialogContent className="w-full max-w-lg">
          <DialogHeader>
            <small> voulez-vous  supprimer la demande de congé du congé de <strong>{demande.typeConge.code} </strong>
              avec motif <strong> {demande.motif}.</strong><br />
              la demande a été faite a la date du <strong>{formaDate(demande.dateDemande)} </strong>
              si vous ne voulez pas executer cette action fermer la fenetre actuelle en cliquant sur la petite croix (x) </small>
          </DialogHeader>
          <div className="flex flex-col gap-4" >
            {/* Dates début / fin */}

            <Button type="submit" className="mt-2 w-full sm:w-fit"
              // disabled={}
              onClick={deleteAskHoliday}
            >
              confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


