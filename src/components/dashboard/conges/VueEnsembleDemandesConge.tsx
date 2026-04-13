'use client'
// gabriel code

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { GetAllDemandeConge } from "@/app/action/conge/demandeconge/action"
import { obtenirCouleurBadgeStatut, obtenirLibelleStatut } from "@/components/dashboard/espaceTravail/utilitaires/statuts"
import { DemandeConge } from "@/utilities/type"
import { useAuth } from "@/app/contexts/auth/context"
import { hasAnyPermission } from "@/security/permissions"
import ApercuPlanificationLiee from "@/components/dashboard/conges/ApercuPlanificationLiee"

const PAGE_SIZE = 14

function canCreatePlanificationForDemande(demande: DemandeConge) {
  return ["CONFIRME", "VALIDE"].includes(demande.statut)
}

function getActivePlanifications(demande: DemandeConge) {
  return Array.isArray(demande.planifications)
    ? demande.planifications.filter((planification) => planification?.statut !== "ANNULE")
    : []
}

function getPlanificationBadge(
  demande: DemandeConge,
  canCreatePlanification: boolean,
  canReadPlanification: boolean
) {
  const activePlanifications = getActivePlanifications(demande)
  const linkedPlanification = activePlanifications[0]
  const canCreate = canCreatePlanification && canCreatePlanificationForDemande(demande)

  if (activePlanifications.length === 0) {
    return (
      <div className="space-y-2">
        <Badge variant="outline" className="whitespace-nowrap">
          Non planifie
        </Badge>
        {canCreate ? (
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/planification?prefillDemandeCongeId=${demande.id}`}>
              Creer planification
            </Link>
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Badge variant="outline" className="whitespace-nowrap">
          {linkedPlanification?.statut || "Planifie"}
        </Badge>
        <p className="text-xs text-muted-foreground">
          {linkedPlanification?.titre || `${activePlanifications.length} planification(s)`}
        </p>
      </div>
      {canReadPlanification ? (
        <ApercuPlanificationLiee planification={linkedPlanification} />
      ) : null}
    </div>
  )
}

export default function AdminDemandeConge() {
  const { auth }: any = useAuth()
  const canCreatePlanification = hasAnyPermission(auth, ["planification.create"])
  const canReadPlanification = hasAnyPermission(auth, [
    "planification.read",
    "planification.create",
    "planification.update",
    "planification.delete",
    "planification.assign",
    "planification.validate",
  ])
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
      const statut = obtenirLibelleStatut(d.statut).toLowerCase()
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
                <TableHead>Planification</TableHead>
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
                    <Badge className={obtenirCouleurBadgeStatut(d.statut)}>
                      {obtenirLibelleStatut(d.statut)}
                    </Badge>
                  </TableCell>
                  <TableCell>{getPlanificationBadge(d, canCreatePlanification, canReadPlanification)}</TableCell>
                </TableRow>
              ))}
              {paginatedDemandes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-4 text-center text-muted-foreground">
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


