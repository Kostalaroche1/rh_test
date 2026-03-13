'use client'

// Gabriel code

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GetAllDemandeConge, UpdateDemandeConge } from "@/app/action/conge/demandeconge/action"
import { DemandeConge } from "@/utilities/type"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getStatutBadgeColor, getStatutLabel, getStatutValue } from "@/components/dashboard/chefServiceDashBoard/publicMethod"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/app/contexts/auth/context"
import { hasAnyPermission } from "@/security/permissions"

const PAGE_SIZE = 14

export default function RhDemandeConge() {
  const { auth }: any = useAuth()
  const [openNewValidateHoliday, setOpenNewValidateHoliday] = useState(false)
  const [statutConge, setstatutConge] = useState("")
  const [loadingId, setLoadingId] = useState<number | null>(null)

  const [demandes, setDemandes] = useState<DemandeConge[]>([])
  const [demande, setDemande] = useState<any>({
    id: 0,
    typeConge: {},
    agent: {},
    role: "",
  })
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const canReadDemandes = hasAnyPermission(auth, ["conge.read", "conge.confirm", "conge.validate"])
  const canValidateDemandes = hasAnyPermission(auth, ["conge.validate"])

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
      const agent = `${d.agent?.nom || ""} ${d.agent?.prenom || ""}`.toLowerCase()
      const dateDebut = new Date(d.dateDebut).toLocaleDateString().toLowerCase()
      const dateFin = new Date(d.dateFin).toLocaleDateString().toLowerCase()
      const type = d.typeConge?.code?.toLowerCase() || ""
      const statut = d.statut?.toLowerCase() || ""

      return (
        agent.includes(query) ||
        dateDebut.includes(query) ||
        dateFin.includes(query) ||
        type.includes(query) ||
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

  async function approuverConge() {
    const toastId = toast.loading("Validation de conge en cours ...")
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
      setOpenNewValidateHoliday(false)
      if (demande.statut === "VALIDE") {
        toast.success("Validation de la demande conge faite avec succes.", { id: toastId })
      } else if (demande.statut === "CONFIRME") {
        toast.error("demande conge non validee", { id: toastId })
      } else if (demande.statut === "REJETE") {
        toast.warning("demande conge rejetee", { id: toastId })
      }
    } catch (error) {
      toast.error("Impossible de traiter la demande.", { id: toastId })
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <>
      {!canReadDemandes && (
        <Card className="w-full">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Aucun acces en lecture sur les demandes de conge.
          </CardContent>
        </Card>
      )}
      {canReadDemandes && (
      <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Demandes de conge</CardTitle>
        </CardHeader>
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
                  <TableHead>Date debut</TableHead>
                  <TableHead>Date fin</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  {canValidateDemandes && <TableHead>Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDemandes.map((d, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{d.agent.nom.toString()}</TableCell>
                    <TableCell>{new Date(d.dateDebut).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(d.dateFin).toLocaleDateString()}</TableCell>
                    <TableCell>{`${d.typeConge.code}(${d.typeConge.dureeMax}/jours)`}</TableCell>
                    <TableCell>
                      <Badge className={getStatutBadgeColor(d.statut)}>{d.statut}</Badge>
                    </TableCell>
                    {canValidateDemandes && (
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={getStatutValue(d.statut, "RH")}
                          onClick={() => {
                            setOpenNewValidateHoliday(true)
                            setDemande({
                              ...demande,
                              id: d.id,
                              typeConge: d.typeConge,
                              agent: d.agent,
                              action: "validate",
                              statut: d.statut === "CONFIRME" ? "VALIDE" : "CONFIRME",
                            })
                          }}
                        >
                          {getStatutLabel(d.statut)}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {paginatedDemandes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canValidateDemandes ? 6 : 5} className="py-4 text-center text-muted-foreground">
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

      <Dialog open={openNewValidateHoliday} onOpenChange={setOpenNewValidateHoliday}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>demande de conge</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <small>
              Etes-vous sur de valider ou rejeter la demande de conge de{" "}
              <strong>{demande.agent.nom}</strong>
            </small>
            <div className="flex gap-2">
              <Button
                type="submit"
                className="mt-2"
                disabled={loadingId === demande.id}
                onClick={() => {
                  setstatutConge("VALIDE")
                  approuverConge()
                }}
              >
                Valider
              </Button>
              <Button
                type="submit"
                variant={"outline"}
                disabled={loadingId === demande.id}
                className="mt-2"
                onClick={() => {
                  setstatutConge("REJETE")
                  approuverConge()
                }}
              >
                Rejeter
              </Button>
              <Button
                type="submit"
                variant={"destructive"}
                disabled={loadingId === demande.id}
                className="mt-2"
                onClick={() => setOpenNewValidateHoliday(false)}
              >
                close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </>
      )}
    </>
  )
}
