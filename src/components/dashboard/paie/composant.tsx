'use client'

import { useState, useEffect } from "react"
import {
  Card, CardHeader, CardTitle, CardContent,
  CardDescription
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Table, TableHeader, TableBody, TableRow, TableCell, TableHead
} from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { DollarSign, FileText, Gift } from "lucide-react"
import { createPaie, deletePaie, getPaies } from "@/app/action/paie/action"
import { useDelete, useGet, usePost } from "@/hooks/useApi"
import { GetAgent } from "@/app/action/agent/getAgent/action"
import Select from "react-select"
import { toast } from "sonner"
import { PDFDownloadLink } from "@react-pdf/renderer";
import { BulletinPDF } from "../paie/bulletinPdf"; // chemin selon ton projet
import { ChartPaieDate } from "@/services/chartPaie"
import { ChartPaie } from "./chartPaie"
import { DateFormatFr } from "@/services/dateFormat"
import { ZoneDonneesVides } from "@/components/dashboard/commun/DonneesVides"
import { appReactSelectStyles, getSelectPortalTarget } from "@/components/ui/react-select-theme"
import { useAuth } from "@/app/contexts/auth/context"
import { hasAnyPermission } from "@/security/permissions"


// ... dans ton composant PaieAvantagesDashboard

/* ---------------- CONSTANTES ---------------- */
const TAUX_RETENUE = 0.1

const statutColor = (statut: string) => {
  if (statut === "PAYE") return "bg-emerald-500/18 text-emerald-500"
  if (statut === "EN_ATTENTE") return "bg-amber-500/18 text-amber-500"
  return "bg-muted text-muted-foreground"
}

/* ---------------- PERMISSIONS ---------------- */
/* ---------------- COMPONENT ---------------- */
export default function PaieAvantagesDashboard({ session }: any) {
  const { auth }: any = useAuth()
  const selectThemeProps = {
    styles: appReactSelectStyles,
    menuPortalTarget: getSelectPortalTarget(),
    menuPosition: "fixed" as const,
  }
  const dialogSelectProps = {
    styles: appReactSelectStyles,
  }
  const canReadPaie = hasAnyPermission(auth, ["paie.read", "paie.create", "paie.update", "paie.delete"])
  const canManagePaie = hasAnyPermission(auth, ["paie.create", "paie.update", "paie.delete"])

  const [openDialog, setOpenDialog] = useState(false)
  const [selectedPaie, setSelectedPaie] = useState<any>(null)
  const [agentFilter, setAgentFilter] = useState<number | null>(null)

  const [form, setForm] = useState({
    agentId: "",
    periode: "",
    salaireBase: "",
    brut: "",
    net: ""
  })

  // const [primes, setPrimes] = useState<{ type: string; montant: number }[]>([])

  const [primes, setPrimes] = useState<{
    type: string;
    montant: number;
    tag: "+" | "-"
  }[]>([])

  const { data: paies = [], refetch } = useGet(['PaieAll'], getPaies)
  const { data: agents = [] } = useGet(['agents'], GetAgent)

  const { mutateAsync: payerAgent, isPending: isPendingPayerAgent } = usePost(createPaie)
  const { mutate: supprimerPaie } = useDelete(deletePaie)

  /* -------- CALCUL AUTO -------- */
  useEffect(() => {
    const salaireBase = Number(form.salaireBase) || 0
    // const totalPrimes = primes.reduce((acc, p) => acc + p.montant, 0)

    const totalPrimes = primes.reduce((acc, p) => {
      if (p.tag === "+") return acc + p.montant
      return acc - p.montant   // default minus
    }, 0)

    const brut = salaireBase + totalPrimes
    const net = brut - brut * TAUX_RETENUE

    setForm(f => ({
      ...f,
      brut: brut.toFixed(2),
      net: net.toFixed(2)
    }))
  }, [form.salaireBase, primes])

  console.log(paies, "paies nest PaieAvantageDasgbord")
  /* -------- INDICATEURS -------- */
  const totalSalaires = paies.reduce((acc: number, p: any) => acc + Number(p.net), 0)
  const salaireMoyen = paies.length ? (totalSalaires / paies.length).toFixed(2) : "0"
  const paieStatsCards = [
    { title: "Total salaires", value: `$${Math.trunc(totalSalaires)}`, tone: "dashboard-stat-tone-red" },
    { title: "Salaire moyen", value: `$${Math.trunc(Number(salaireMoyen))}`, tone: "dashboard-stat-tone-soft" },
    { title: "Bulletins", value: paies.length, tone: "dashboard-stat-tone-sky" },
  ]

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    const response = await payerAgent({
      agentId: Number(form.agentId),
      periode: form.periode,
      salaireBase: Number(form.salaireBase),
      brut: Number(form.brut),
      net: Number(form.net),
      etat: "PAYE",
      primes
    })
    setOpenDialog(false)
    toast.info(response.message)
    setForm({ agentId: "", periode: "", salaireBase: "", brut: "", net: "" })
    setPrimes([])
    refetch()
    if (response.status !== 200) return
  }

  const paiesFiltrees = agentFilter
    ? paies.filter((p: any) => p.agentId === agentFilter)
    : paies

  const chartData = ChartPaieDate(paiesFiltrees)
  const agentOptions = agents
    .map((a: any) => {
      const agent = a?.compteAgent?.agent
      if (!agent?.id) return null
      const name = `${agent?.nom || ""} ${agent?.prenom || ""}`.trim()
      return {
        value: agent.id,
        label: agent.matricule,
        name: name || agent.matricule,
      }
    })
    .filter(Boolean)



  /* ---------------- RENDER ---------------- */
  return (
    <div className="erp-page">
      <h1 className="text-3xl font-bold">Gestion Paie & Avantages</h1>
      {!canReadPaie && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Aucun acces en lecture sur le module paie.
          </CardContent>
        </Card>
      )}
      {canReadPaie && (
      <>

      {/* INDICATEURS */}
      <div className="grid md:grid-cols-3 gap-4">
        {paieStatsCards.map((item) => (
          <Card key={item.title} className={`dashboard-stat-card py-4 ${item.tone}`}>
            <CardHeader className="gap-1 px-4 pb-2">
              <p className="dashboard-stat-title">{item.title}</p>
              <CardTitle className="dashboard-stat-value text-3xl">{item.value}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pt-0">
              <p className="text-xs text-muted-foreground">Mise a jour sur la periode en cours</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* TABS */}
      <Tabs defaultValue="bulletins">
        <TabsList>
          <TabsTrigger value="bulletins">Bulletins</TabsTrigger>
          <TabsTrigger value="apercu">Aperçu graphique</TabsTrigger>
        </TabsList>

        <TabsContent value="apercu">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Évolution des salaires nets
              </CardTitle>
              <CardDescription>
                Aperçu graphique par période
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paies.length !== 0 ? (
                <ChartPaie chartData={chartData} />
              ) : (
                <p className="text-center text-sm text-muted-foreground py-12">Aucune donnée à afficher</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulletins">
          <div className="flex gap-2">
            {canManagePaie && (
              <Button className="mb-4" onClick={() => setOpenDialog(true)} >
                <FileText className="w-4 h-4 mr-2" /> Payer un agent
              </Button>
            )}
            <PDFDownloadLink
              document={
                <BulletinPDF
                  paie={''}
                  paies={paies}
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
          </div>
          <Card>
            {paies.length !== 0 ?
              <CardContent>
                <Select
                  options={agentOptions}
                  onChange={(opt: any) => setAgentFilter(opt?.value || null)}
                  isClearable
                  placeholder="Filtrer par agent"
                  {...selectThemeProps}
                  formatOptionLabel={(option: any) => (
                    <div title={option.name} className="truncate">
                      {option.label}
                    </div>
                  )}
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
                    {paiesFiltrees.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell>{"" + DateFormatFr(p.datePaiement)}</TableCell>
                        <TableCell>{p.agent?.nom}</TableCell>
                        <TableCell>${parseInt(p.net)}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded ${statutColor(p.etat)}`}>{p.etat}</span>
                        </TableCell>
                        <TableCell className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedPaie(p)}>Voir</Button>
                          {canManagePaie && (
                            <Button size="sm" variant="destructive" onClick={() => supprimerPaie(p.id, { onSuccess: refetch })}>Supprimer</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent> :
              <ZoneDonneesVides />
            }

          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG PAIEMENT */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Payer un agent</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              options={agentOptions}
              onChange={opt => setForm({ ...form, agentId: opt?.value })}
              placeholder="-- Sélectionnez un agent --"
              isClearable
              {...dialogSelectProps}
              formatOptionLabel={(option: any) => (
                <div title={option.name} className="truncate">
                  {option.label}
                </div>
              )}
              className="min-w-[200px]"
            />

            <Input type="date" placeholder="Période de paiement" value={form.periode} onChange={e => setForm({
              ...form,
              periode: e.target.value
            })} />
            <Input type="number" placeholder="Salaire de base" value={form.salaireBase} onChange={e => setForm({ ...form, salaireBase: e.target.value })} />

            <div className="space-y-2">
              <h4 className="font-semibold flex items-center gap-2"><Gift className="w-4 h-4" /> Primes</h4>
              {primes.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <select
                    value={p.tag}
                    onChange={(e) => {
                      const copy = [...primes];
                      copy[i].tag = e.target.value as "+" | "-";
                      setPrimes(copy);
                    }}
                    className="border rounded px-2"
                  >
                    <option value="-">-</option>
                    <option value="+">+</option>
                  </select>
                  <Input placeholder="Type" value={p.type} onChange={e => { const copy = [...primes]; copy[i].type = e.target.value; setPrimes(copy) }} />
                  <Input type="number" placeholder="Montant" value={p.montant} onChange={e => { const copy = [...primes]; copy[i].montant = Number(e.target.value); setPrimes(copy) }} />
                  <Button type="button" variant="destructive" onClick={() => setPrimes(primes.filter((_, idx) => idx !== i))}>✕</Button>
                </div>
              ))}

              {/* <Button type="button" variant="outline"
                onClick={() => setPrimes([...primes, { type: "", montant: 0 }])}
              >+ Ajouter une prime</Button> */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setPrimes([
                  ...primes,
                  { type: "", montant: 0, tag: "-" }
                ])}
              >+ Ajouter une prime</Button>
            </div>

            <Separator />
            <p><b>Brut :</b> ${form.brut}</p>
            <p><b>Net :</b> ${form.net}</p>

            <Button type="submit" disabled={isPendingPayerAgent}><DollarSign className="w-4 h-4 mr-2" /> Payer</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* BULLETIN PDF SÉCURISÉ */}

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
      </>
      )}

    </div>
  )
}






