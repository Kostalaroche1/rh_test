"use client"

// gabriel code

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCheck } from "lucide-react"
import { DemandeConge, emptyDemande } from "@/utilities/type"
import { GetAllDemandeConge, UpdateDemandeConge } from "@/app/action/conge/demandeconge/action"
import { obtenirCouleurBadgeStatut, obtenirLibelleStatut, obtenirValeurStatut } from "@/components/dashboard/espaceTravail/utilitaires/statuts"
import { formatInputDate } from "@/components/dashboard/conges/SelectionTypeConge"
import { toast } from "sonner"
import { useAuth } from "@/app/contexts/auth/context"
import { hasAnyPermission } from "@/security/permissions"

const PAGE_SIZE = 14

export default function ChefServiceDemandeConge() {
  const { auth }: any = useAuth()
  const [openNewModifyDemandeConge, setOpenNewModifyDemandeConge] = useState(false)
  const [demandes, setDemandes] = useState<DemandeConge[]>([])
  const [demande, setDemande] = useState<DemandeConge>(emptyDemande)
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const canReadDemandes = hasAnyPermission(auth, ["demande_conge.read", "demande_conge.confirm", "demande_conge.validate"])
  const canConfirmDemandes = hasAnyPermission(auth, ["demande_conge.confirm"])

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

    return demandes.filter((item) => {
      const agent = `${item.agent?.nom || ""} ${item.agent?.prenom || ""}`.toLowerCase()
      const type = item.typeConge?.code?.toLowerCase() || ""
      const dateDebut = formatInputDate(item.dateDebut).toLowerCase()
      const dateFin = formatInputDate(item.dateFin).toLowerCase()
      const statut = item.statut?.toLowerCase() || ""

      return (
        agent.includes(query) ||
        type.includes(query) ||
        dateDebut.includes(query) ||
        dateFin.includes(query) ||
        statut.includes(query)
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

  const modifyAskForHoliday = async () => {
    const toastId = toast.loading(`confirmation de conge ${demande.agent.nom ?? ""} ${demande.agent.prenom ?? ""} en cours ...`)
    try {
      if (!demande?.id) {
        toast.warning("demande manquant")
        return
      }
      const data = await UpdateDemandeConge(demande)

      if (!data.success) {
        toast.error(data.message, { id: toastId })
        return
      }
      await getDemande()
      setOpenNewModifyDemandeConge(false)
      toast.success(` ${demande.statut === "EN_ATTENTE" ? "La remise en attente  " : "La confirmation"} de la demande de conge de ${demande.agent.nom} faite avec succes.`, { id: toastId })
    } catch (error) {
      toast.error("Impossible de traiter la demande.", { id: toastId })
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <>
      {!canReadDemandes && (
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aucun acces en lecture sur les demandes de conge.
        </CardContent>
      )}
      {canReadDemandes && (
      <>
      <CardContent>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher agent, type, date, statut..."
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
                <TableHead>Type</TableHead>
                <TableHead>Date debut</TableHead>
                <TableHead>Date fin</TableHead>
                <TableHead>Statut</TableHead>
                {canConfirmDemandes && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDemandes.map((demandeconge, idx) => (
                <TableRow key={idx}>
                  <TableCell>{demandeconge.agent.nom || null}</TableCell>
                  <TableCell>{demandeconge.typeConge.code || null}</TableCell>
                  <TableCell>{formatInputDate(demandeconge.dateDebut) || null}</TableCell>
                  <TableCell>{formatInputDate(demandeconge.dateFin) || null}</TableCell>
                  <TableCell>
                    <Badge className={obtenirCouleurBadgeStatut(demandeconge.statut)}>
                      {demandeconge.statut || null}
                    </Badge>
                  </TableCell>
                  {canConfirmDemandes && (
                    <TableCell className="flex justify-end">
                      <Button
                        variant="outline"
                        className="w-1/1.5 "
                        disabled={obtenirValeurStatut(demandeconge.statut, "team")}
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
                            action: "confirm",
                          })
                        }}
                      >
                        <CheckCheck className="w-5/ h-5 mr-2" />
                        {obtenirLibelleStatut(demandeconge.statut)}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {paginatedDemandes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canConfirmDemandes ? 6 : 5} className="py-4 text-center text-muted-foreground">
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

      <Dialog open={openNewModifyDemandeConge} onOpenChange={setOpenNewModifyDemandeConge}>
        <DialogContent className="w-full max-w-lg">
          <DialogTitle>Messages</DialogTitle>
          <DialogHeader>
            <small>
              voulez-vous mettre {obtenirLibelleStatut(demande.statut)} une demande de conge de l'agent{" "}
              <strong>{demande.agent.nom}</strong>.
            </small>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              type="submit"
              className="mt-2 w-full sm:w-fit"
              disabled={loadingId === demande.id}
              onClick={() => {
                setLoadingId(demande.id)
                modifyAskForHoliday()
              }}
            >
              confirmer
            </Button>
            <Button
              type="submit"
              variant={"destructive"}
              className="mt-2 w-full sm:w-fit"
              disabled={loadingId === demande.id}
              onClick={() => setOpenNewModifyDemandeConge(false)}
            >
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </>
      )}
    </>
  )
}





