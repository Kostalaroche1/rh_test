"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { getAllPresence } from "@/app/action/agent/presence/action"
import { formatDate, formatTime } from "./ChiefPresence"
import { getStatutBadgeColor } from "../../chefServiceDashBoard/publicMethod"
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
  confirmePar?: {
    login: string
  }
}

const PAGE_SIZE = 14

export default function AdminPresences() {
  const [presences, setPresences] = useState<RHPresence[]>([])
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

  const filteredPresences = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return presences
    }

    return presences.filter((item) => {
      const fullName = `${item.agent.nom} ${item.agent.prenom}`.toLowerCase()
      const service = item.agent.service?.nom?.toLowerCase() || ""
      const statut = computePresenceStatus(item).toLowerCase()
      const confirmePar = item.confirmePar?.login?.toLowerCase() || ""
      const date = formatDate(item.date).toLowerCase()

      return (
        fullName.includes(query) ||
        service.includes(query) ||
        statut.includes(query) ||
        confirmePar.includes(query) ||
        date.includes(query)
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
              placeholder="Rechercher agent, service, statut, date..."
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
                        <Badge className={getStatutBadgeColor(displayStatut)}>
                          {displayStatut}
                        </Badge>
                      )
                    })()}
                  </TableCell>

                    <TableCell>{item.confirmePar ? item.confirmePar.login : "--"}</TableCell>
                  </TableRow>
                ))}

                {paginatedPresences.length === 0 && (
                  <TableRow>
                    <TableCell className="py-4 text-center text-muted-foreground" colSpan={7}>
                      Aucun resultat
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
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
