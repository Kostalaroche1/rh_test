'use client'
// gabriel code

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { GetAllDemandeConge } from "@/app/action/conge/demandeconge/action"
import { getStatutBadgeColor, getStatutLabel } from "@/components/dashboard/chefServiceDashBoard/publicMethod"
import { DemandeConge } from "@/utilities/type"

const PAGE_SIZE = 14

export default function AdminDemandeConge() {
  const [demandes, setDemandes] = useState<DemandeConge[]>([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const getDemande = async () => {
    const data = await GetAllDemandeConge()
    setDemandes(data.getData)
  }

  useEffect(() => {
    getDemande()
  }, [])

  const filteredDemandes = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return demandes
    }

    return demandes.filter((d) => {
      const agent = `${d.agent.nom || ""} ${d.agent.prenom || ""}`.toLowerCase()
      const type = d.typeConge?.code?.toLowerCase() || ""
      const statut = getStatutLabel(d.statut).toLowerCase()
      const dateDebut = new Date(d.dateDebut).toLocaleDateString().toLowerCase()
      const dateFin = new Date(d.dateFin).toLocaleDateString().toLowerCase()

      return (
        agent.includes(query) ||
        type.includes(query) ||
        statut.includes(query) ||
        dateDebut.includes(query) ||
        dateFin.includes(query)
      )
    })
  }, [demandes, search])

  useEffect(() => {
    setPage(1)
  }, [search])

  const totalPages = Math.max(1, Math.ceil(filteredDemandes.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginatedDemandes = filteredDemandes.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Demandes de conge</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher agent, type, statut, date..."
            className="w-full md:max-w-sm"
          />
          <p className="text-sm text-muted-foreground">
            Total: {demandes.length} | Resultats: {filteredDemandes.length}
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Date debut</TableHead>
                <TableHead>Date fin</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDemandes.map((d, idx) => (
                <TableRow key={idx}>
                  <TableCell>{`${d.agent.nom || ""} ${d.agent.prenom || ""}`.trim()}</TableCell>
                  <TableCell>{new Date(d.dateDebut).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(d.dateFin).toLocaleDateString()}</TableCell>
                  <TableCell>{d.typeConge.code}</TableCell>
                  <TableCell>
                    <Badge className={getStatutBadgeColor(d.statut)}>
                      {getStatutLabel(d.statut)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedDemandes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-4 text-center text-muted-foreground">
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
  )
}
