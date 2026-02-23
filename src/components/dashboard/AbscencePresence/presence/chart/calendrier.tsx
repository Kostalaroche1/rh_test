"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"

type DonneesPresence = {
  PRESENT: string[]
  ABSENT: string[]
  RETARD: string[]
}

export function CalendarPresence({ stats }: any) {
  const [dateCourante, setDateCourante] = useState(new Date())
  const [jourSelectionne, setJourSelectionne] = useState<{ date: Date; data?: DonneesPresence } | null>(null)

  const annee = dateCourante.getFullYear()
  const mois = dateCourante.getMonth()

  const premierJour = new Date(annee, mois, 1)
  const dernierJour = new Date(annee, mois + 1, 0)

  const joursDansLeMois = dernierJour.getDate()
  const debutSemaineMois = premierJour.getDay()

  const cartePresences = useMemo(() => {
    const carte: Record<string, DonneesPresence> = {}

    stats?.AgentsPresences?.forEach((agent: any) => {
      agent.presences?.forEach((p: any) => {
        const cleDate = new Date(p.date).toDateString()

        if (!carte[cleDate]) {
          carte[cleDate] = {
            PRESENT: [],
            ABSENT: [],
            RETARD: []
          }
        }

        if (carte[cleDate][p.statut as keyof DonneesPresence]) {
          carte[cleDate][p.statut as keyof DonneesPresence].push(agent.nom || "Agent")
        }
      })
    })

    return carte
  }, [stats])

  const calculerTotal = (donnees?: DonneesPresence) => {
    if (!donnees) return 0
    return donnees.PRESENT.length + donnees.ABSENT.length + donnees.RETARD.length
  }

  const couleurIntensite = (donnees?: DonneesPresence) => {
    const totalJour = calculerTotal(donnees)
    if (totalJour >= 10) return "bg-primary/20"
    if (totalJour >= 5) return "bg-primary/10"
    if (totalJour > 0) return "bg-slate-50"
    return "bg-background"
  }

  const tableauJours: Array<number | null> = []

  for (let i = 0; i < debutSemaineMois; i++) tableauJours.push(null)
  for (let jour = 1; jour <= joursDansLeMois; jour++) tableauJours.push(jour)

  return (
    <>
      <Card className="w-full rounded-2xl border shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Calendrier analytique</CardTitle>
            <CardDescription>Vue detaillee des presences par jour</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" onClick={() => setDateCourante(new Date(annee, mois - 1, 1))}>
              <ChevronLeft size={18} />
            </Button>

            <div className="min-w-[170px] px-4 text-center font-semibold capitalize">
              {dateCourante.toLocaleDateString("fr-FR", {
                month: "long",
                year: "numeric"
              })}
            </div>

            <Button size="icon" variant="outline" onClick={() => setDateCourante(new Date(annee, mois + 1, 1))}>
              <ChevronRight size={18} />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Present</Badge>
            <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Absent</Badge>
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Retard</Badge>
          </div>

          <div className="mb-3 grid grid-cols-7 text-center text-xs font-semibold uppercase text-slate-500 md:text-sm">
            {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 md:gap-3">
            {tableauJours.map((jour, idx) => {
              if (!jour) return <div key={`empty-${idx}`} />

              const dateComplete = new Date(annee, mois, jour)
              const donnees = cartePresences[dateComplete.toDateString()]
              const totalJour = calculerTotal(donnees)

              return (
                <TooltipProvider key={jour}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        onClick={() => setJourSelectionne({ date: dateComplete, data: donnees })}
                        className={`h-28 rounded-2xl border p-2 text-left text-xs shadow-sm transition ${couleurIntensite(donnees)}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{jour}</span>
                          {totalJour > 0 && <Badge variant="secondary">{totalJour}</Badge>}
                        </div>

                        {donnees && (
                          <div className="mt-2 space-y-1 text-[11px]">
                            {donnees.PRESENT.length > 0 && <div className="text-emerald-700">Present {donnees.PRESENT.length}</div>}
                            {donnees.ABSENT.length > 0 && <div className="text-rose-700">Absent {donnees.ABSENT.length}</div>}
                            {donnees.RETARD.length > 0 && <div className="text-amber-700">Retard {donnees.RETARD.length}</div>}
                          </div>
                        )}
                      </motion.button>
                    </TooltipTrigger>

                    <TooltipContent>{totalJour > 0 ? `${totalJour} enregistrements` : "Aucune donnee"}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!jourSelectionne} onOpenChange={() => setJourSelectionne(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Details du {jourSelectionne?.date?.toLocaleDateString("fr-FR")}</DialogTitle>
          </DialogHeader>

          {jourSelectionne?.data ? (
            <div className="space-y-4">
              {(["PRESENT", "ABSENT", "RETARD"] as const).map(
                (type) =>
                  jourSelectionne.data &&
                  jourSelectionne.data[type].length > 0 && (
                    <div key={type}>
                      <h4 className="mb-2 font-semibold">{type}</h4>
                      <ul className="space-y-1 text-sm">
                        {jourSelectionne.data[type].map((name: string, i: number) => (
                          <li key={i}>- {name}</li>
                        ))}
                      </ul>
                    </div>
                  )
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune donnee pour ce jour.</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
