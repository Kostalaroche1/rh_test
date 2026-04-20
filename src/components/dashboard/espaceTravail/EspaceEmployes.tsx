'use client'

import { useEffect, useState } from "react"
import { FileText } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { PDFDownloadLink } from "@react-pdf/renderer"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

import { useAuth } from "@/app/contexts/auth/context"
import { getPaiesByAgent } from "@/app/action/paie/getPaiesByAgents/action"
import { GetDashAgent } from "@/app/action/agent/dash/action"
import { useGet } from "@/hooks/useApi"
import { BulletinPDF } from "@/components/dashboard/paie/bulletinPdf"
import { hasAnyPermission } from "@/security/permissions"
import PanneauPresences from "@/components/dashboard/espaceTravail/PanneauPresences"
import PanneauDemandesConge from "@/components/dashboard/espaceTravail/PanneauDemandesConge"

export default function EspaceEmployes() {
  const [selectedBulletin, setSelectedBulletin] = useState<any>(null)
  const [bulletins, setBulletins] = useState<any[]>([])

  const { auth }: any = useAuth()
  const canReadConge = hasAnyPermission(auth, ["demande_conge.read", "demande_conge.request", "demande_conge.update", "demande_conge.delete"])
  const canReadPresence = hasAnyPermission(auth, [
    "presence.read",
    "presence.sign",
    "presence.biometric",
  ])
  const canReadPaie = hasAnyPermission(auth, ["paie.read"])
  const visibleTabs = [
    { value: "dashboard", label: "Dashboard" },
    canReadConge ? { value: "conges", label: "Conges" } : null,
    canReadPaie ? { value: "bulletins", label: "Bulletins" } : null,
    canReadPresence ? { value: "presence", label: "Presence" } : null,
  ].filter(Boolean) as { value: string; label: string }[]
  const { data: stats = [], isPending: isPendingDash } = useGet(["agentDash"], GetDashAgent)

  useEffect(() => {
    if (auth?.userId) {
      getPaiesByAgent(auth.userId).then((data: any[]) => setBulletins(data))
    }
  }, [auth])

  const calculateTotals = (bulletin: any) => {
    const totalPrimes = bulletin.primes?.reduce((acc: number, p: any) => acc + Number(p.montant), 0) || 0
    const brut = Number(bulletin.salaireBase) + totalPrimes
    const net = brut * 0.8
    return { totalPrimes, brut, net }
  }

  const chartDataAg = [
    { name: "Presences", nbres: stats ? stats.presences : 0, fill: "#22c55e" },
    { name: "Absences", nbres: stats ? stats.absences : 0, fill: "#ef4444" },
  ]

  const presenceChartConfig = {
    nbres: {
      label: "Total",
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig

  const peopleStatsCards = [
    { title: "Conges restants", value: `${stats?.conges ?? 0} jours`, tone: "dashboard-stat-tone-soft" },
    { title: "Conges demandes", value: stats?.demandeconges ?? 0, tone: "dashboard-stat-tone-blue" },
  ]

  return (
    <div className="erp-page">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Mon espace</h1>
        <p className="text-muted-foreground">Vue personnelle basee sur vos permissions et votre affectation.</p>
      </div>

      <Separator />

      <Tabs defaultValue={visibleTabs[0].value} className="w-full">
        <TabsList className="mb-4 md:flex align-center">
          {visibleTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>

        {canReadConge && <TabsContent value="conges" className="flex flex-col gap-6">
          <PanneauDemandesConge />
        </TabsContent>}

        {canReadPresence && <TabsContent value="presence" className="flex">
          <PanneauPresences />
        </TabsContent>}

        <TabsContent value="dashboard" className="flex flex-col gap-6">
          {isPendingDash && <Skeleton className="w-full p-20" />}
          {!isPendingDash && stats && (
            <div className="flex flex-col gap-6">
              <div className="grid gap-4 md:grid-cols-2">
                {peopleStatsCards.map((item) => (
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

              <Card className="w-full min-h-[400px] border border-border bg-card py-4 shadow-sm">
                <CardHeader className="px-4 pb-2">
                  <CardTitle>Statistiques de presence</CardTitle>
                  <CardDescription>Visualisation du nombre d'absences et presences</CardDescription>
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
            </div>
          )}
        </TabsContent>

        {canReadPaie && <TabsContent value="bulletins" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Bulletins de paie</CardTitle>
              <CardDescription>Consulter vos bulletins et suivre l'evolution</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {bulletins.length ? (
                bulletins.map((bulletin) => (
                  <Button
                    key={bulletin.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setSelectedBulletin(bulletin)}
                  >
                    <FileText className="mr-2 h-5 w-5" /> {new Date(bulletin.datePaiement).toLocaleString()}
                  </Button>
                ))
              ) : (
                <p className="text-center text-muted-foreground">Aucun bulletin disponible</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>}
      </Tabs>

      {selectedBulletin && (
        <Dialog open onOpenChange={() => setSelectedBulletin(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulletin de paie</DialogTitle>
            </DialogHeader>

            <div className="space-y-2 text-sm">
              <p><b>Periode :</b> {new Date(selectedBulletin.datePaiement).toLocaleString()}</p>
              <p><b>Salaire de base :</b> ${selectedBulletin.salaireBase}</p>
              {(selectedBulletin.primes || []).map((prime: any, idx: number) => (
                <p key={idx}><b>{prime.nom} :</b> ${prime.montant}</p>
              ))}
              <p><b>Brut :</b> ${calculateTotals(selectedBulletin).brut}</p>
              <p><b>Net a payer :</b> ${calculateTotals(selectedBulletin).net}</p>
            </div>
            <PDFDownloadLink
              document={<BulletinPDF paie={selectedBulletin} />}
              fileName={`bulletin-${selectedBulletin.agent?.nom}.pdf`}
            >
              {({ loading }) => (
                <Button className="mt-4">
                  <FileText className="mr-2 h-4 w-4" />
                  {loading ? "Generation..." : "Telecharger PDF"}
                </Button>
              )}
            </PDFDownloadLink>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

