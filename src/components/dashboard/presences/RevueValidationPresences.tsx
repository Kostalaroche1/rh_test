"use client"

// Gabriel code

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle } from "lucide-react"
import { getAllPresence, UpdatePresence } from "@/app/action/agent/presence/action"
import { formatDate, formatTime } from "@/components/dashboard/espaceTravail/utilitaires/dates"
import { obtenirCouleurBadgeStatut } from "@/components/dashboard/espaceTravail/utilitaires/statuts"
import { toast } from "sonner"
import { computePresenceStatus } from "@/utilities/presence"

type RHPresence = {
  id: number
  agent: {
    nom: string
    prenom: string
    service: {
      nom: string
    }
  }
  date: string
  heureArrivee: string | null
  heureDepart: string | null
  statut: string
  statutWorkflow?: string
  confirmePar?: {
    email: string
  }
}

const PAGE_SIZE = 14

export default function RHPresences() {
  const [presences, setPresences] = useState<RHPresence[]>([])
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  async function fetchPresences() {
    const data = await getAllPresence()
    if (!data) {
      return
    }
    setPresences(data)
  }

  useEffect(() => {
    fetchPresences()
  }, [])

  async function handleValidate(id: number) {
    const toastId = toast.loading("Validation de la presence en cours...")
    try {
      setLoadingId(id)
      const todayDate = new Date()
      const data = await UpdatePresence({ id, action: "validate", todayDate })
      if (!data.success) {
        toast.error(data.message, { id: toastId })
        return
      }
      await fetchPresences()
      toast.success("Depart enregistre avec succes.", { id: toastId })
    } catch (error) {
      toast.error("Impossible d'enregistrer le depart.", { id: toastId })
    } finally {
      setLoadingId(null)
    }
  }

  const filteredPresences = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return presences
    }

    return presences.filter((item) => {
      const agent = `${item.agent.nom} ${item.agent.prenom}`.toLowerCase()
      const service = item.agent.service?.nom?.toLowerCase() || ""
      const date = formatDate(item.date).toLowerCase()
      const arrivee = formatTime(item.heureArrivee).toLowerCase()
      const depart = formatTime(item.heureDepart).toLowerCase()
      const statut = computePresenceStatus(item).toLowerCase()
      const workflow = item.statutWorkflow?.toLowerCase() || ""
      const confirmePar = item.confirmePar?.email?.toLowerCase() || ""

      return (
        agent.includes(query) ||
        service.includes(query) ||
        date.includes(query) ||
        arrivee.includes(query) ||
        depart.includes(query) ||
        statut.includes(query) ||
        workflow.includes(query) ||
        confirmePar.includes(query)
      )
    })
  }, [presences, search])

  useEffect(() => {
    setPage(1)
  }, [search])

  const totalPages = Math.max(1, Math.ceil(filteredPresences.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginatedPresences = filteredPresences.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion globale des presences</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher agent, service, date, statut..."
              className="w-full md:max-w-sm"
            />
            <p className="text-sm text-muted-foreground">
              Total: {presences.length} | Resultats: {filteredPresences.length}
            </p>
          </div>

          <div className="overflow-x-auto">
            <Table className="w-full text-sm">
              <TableHeader className="border-b text-muted-foreground">
                <TableRow>
                  <TableCell className="text-left py-2">Agent</TableCell>
                  <TableCell className="text-left py-2">Service</TableCell>
                  <TableCell className="text-left py-2">Date</TableCell>
                  <TableCell className="text-left py-2">Arrivee</TableCell>
                  <TableCell className="text-left py-2">Depart</TableCell>
                  <TableCell className="text-left py-2">Statut</TableCell>
                  <TableCell className="text-left py-2">Confirme par</TableCell>
                  <TableCell className="text-left py-2">Action</TableCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedPresences.map((item) => (
                  <TableRow key={item.id} className="border-b">
                    <TableCell className="py-2">
                      {item.agent.nom} {item.agent.prenom}
                    </TableCell>

                    <TableCell>{item.agent.service?.nom || "--"}</TableCell>
                    <TableCell>{formatDate(item.date)}</TableCell>
                    <TableCell>{formatTime(item.heureArrivee)}</TableCell>
                    <TableCell>{formatTime(item.heureDepart)}</TableCell>

                    <TableCell>
                      {(() => {
                        const displayStatut = computePresenceStatus(item)
                        return (
                          <Badge className={obtenirCouleurBadgeStatut(displayStatut)}>{displayStatut}</Badge>
                        )
                      })()}
                    </TableCell>

                    <TableCell>{item.confirmePar ? item.confirmePar.email : "--"}</TableCell>

                    <TableCell>
                      {(item.statutWorkflow
                        ? item.statutWorkflow === "CONFIRME"
                        : item.statut === "CONFIRME") ? (
                        <Button
                          size="sm"
                          onClick={() => handleValidate(item.id)}
                          disabled={loadingId === item.id}
                        >
                          <CheckCircle size={14} className="mr-1" />
                          valider
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">--</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {paginatedPresences.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-4 text-center text-muted-foreground">
                      Aucun resultat
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
            >
              Precedent
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
            >
              Suivant
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

