"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { getAllPresence, getAllPresencePointages, UpdatePresencePointage } from "@/app/action/agent/presence/action"
import { formatDate, formatTime } from "@/components/dashboard/espaceTravail/utilitaires/dates"
import { obtenirCouleurBadgeStatut } from "@/components/dashboard/espaceTravail/utilitaires/statuts"
import { computePresenceStatus } from "@/utilities/presence"
import { useAuth } from "@/app/contexts/auth/context"
import { hasAnyPermission } from "@/security/permissions"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

type RHPresence = {
  id: number
  agent: {
    nom: string
    prenom: string
    service?: {
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

type PresencePointageItem = {
  presenceId: number
  id: string
  date: string
  type: "ARRIVEE" | "DEPART"
  heurePointage: string
  source: string
  note: string | null
  agent: {
    id: number
    nom: string
    prenom: string
    matricule: string
  }
  createdById?: number | null
  updatedById?: number | null
}

const PAGE_SIZE = 14

function toDatetimeLocalValue(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, "0")
  const d = `${date.getDate()}`.padStart(2, "0")
  const hh = `${date.getHours()}`.padStart(2, "0")
  const mm = `${date.getMinutes()}`.padStart(2, "0")
  return `${y}-${m}-${d}T${hh}:${mm}`
}

export default function AdminPresences() {
  const { auth }: any = useAuth()
  const canReadPointages = hasAnyPermission(auth, ["presence.read", "presence.update"])
  const canUpdatePointages = hasAnyPermission(auth, ["presence.update"])

  const [presences, setPresences] = useState<RHPresence[]>([])
  const [pointages, setPointages] = useState<PresencePointageItem[]>([])

  const [searchPresence, setSearchPresence] = useState("")
  const [searchPointage, setSearchPointage] = useState("")
  const [pagePresence, setPagePresence] = useState(1)
  const [pagePointage, setPagePointage] = useState(1)

  const [editing, setEditing] = useState<PresencePointageItem | null>(null)
  const [editDateTime, setEditDateTime] = useState("")
  const [editType, setEditType] = useState<"ARRIVEE" | "DEPART">("ARRIVEE")
  const [editNote, setEditNote] = useState("")
  const [saving, setSaving] = useState(false)

  async function fetchPresences() {
    const data = await getAllPresence()
    if (!data) {
      return
    }
    setPresences(data)
  }

  async function fetchPointages() {
    if (!canReadPointages) {
      setPointages([])
      return
    }
    const data = await getAllPresencePointages()
    if (!data) {
      return
    }
    setPointages(data)
  }

  async function refreshAll() {
    await Promise.all([fetchPresences(), fetchPointages()])
  }

  useEffect(() => {
    void refreshAll()
  }, [canReadPointages])

  const filteredPresences = useMemo(() => {
    const query = searchPresence.trim().toLowerCase()
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
  }, [presences, searchPresence])

  const filteredPointages = useMemo(() => {
    const query = searchPointage.trim().toLowerCase()
    if (!query) {
      return pointages
    }

    return pointages.filter((item) => {
      const fullName = `${item.agent.nom} ${item.agent.prenom}`.toLowerCase()
      const matricule = item.agent.matricule.toLowerCase()
      const typeLabel = item.type === "ARRIVEE" ? "arrivee" : "depart"
      const date = formatDate(item.date).toLowerCase()
      const heure = formatTime(item.heurePointage).toLowerCase()
      const note = (item.note ?? "").toLowerCase()

      return (
        fullName.includes(query) ||
        matricule.includes(query) ||
        typeLabel.includes(query) ||
        date.includes(query) ||
        heure.includes(query) ||
        note.includes(query)
      )
    })
  }, [pointages, searchPointage])

  useEffect(() => {
    setPagePresence(1)
  }, [searchPresence])

  useEffect(() => {
    setPagePointage(1)
  }, [searchPointage])

  const totalPagesPresence = Math.max(1, Math.ceil(filteredPresences.length / PAGE_SIZE))
  const currentPagePresence = Math.min(pagePresence, totalPagesPresence)
  const paginatedPresences = filteredPresences.slice(
    (currentPagePresence - 1) * PAGE_SIZE,
    currentPagePresence * PAGE_SIZE
  )

  const totalPagesPointage = Math.max(1, Math.ceil(filteredPointages.length / PAGE_SIZE))
  const currentPagePointage = Math.min(pagePointage, totalPagesPointage)
  const paginatedPointages = filteredPointages.slice(
    (currentPagePointage - 1) * PAGE_SIZE,
    currentPagePointage * PAGE_SIZE
  )

  function openEdit(pointage: PresencePointageItem) {
    setEditing(pointage)
    setEditDateTime(toDatetimeLocalValue(pointage.heurePointage))
    setEditType(pointage.type)
    setEditNote(pointage.note ?? "")
  }

  async function saveEdit() {
    if (!editing || !canUpdatePointages) {
      return
    }

    const parsed = new Date(editDateTime)
    if (!editDateTime || Number.isNaN(parsed.getTime())) {
      toast.error("Heure de correction invalide.")
      return
    }

    setSaving(true)
    const response = await UpdatePresencePointage({
      presenceId: editing.presenceId,
      id: editing.id,
      heurePointage: parsed.toISOString(),
      type: editType,
      note: editNote,
    })

    if (!response.success) {
      toast.error(response.message || "Impossible de corriger ce pointage.")
      setSaving(false)
      return
    }

    toast.success("Pointage corrige avec succes.")
    setSaving(false)
    setEditing(null)
    await refreshAll()
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion globale des presences</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="w-full md:max-w-sm">
              <Label htmlFor="presences-ensemble-recherche">Recherche</Label>
              <Input
                id="presences-ensemble-recherche"
                value={searchPresence}
                onChange={(e) => setSearchPresence(e.target.value)}
                placeholder="Rechercher agent, service, statut, date..."
                className="w-full"
              />
            </div>
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
                          <Badge className={obtenirCouleurBadgeStatut(displayStatut)}>
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
              onClick={() => setPagePresence((prev) => Math.max(1, prev - 1))}
              disabled={currentPagePresence <= 1}
            >
              Precedent
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPagePresence} / {totalPagesPresence}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagePresence((prev) => Math.min(totalPagesPresence, prev + 1))}
              disabled={currentPagePresence >= totalPagesPresence}
            >
              Suivant
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entrees et sorties biometrques</CardTitle>
          <CardDescription>
            Derniers pointages des employes. La correction est reservee a la permission
            `presence.update`.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!canReadPointages && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              Vous n'avez pas la permission de consulter les entrees/sorties detaillees.
            </div>
          )}

          {canReadPointages && (
            <>
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="w-full md:max-w-sm">
                  <Label htmlFor="presences-pointages-recherche">Recherche</Label>
                  <Input
                    id="presences-pointages-recherche"
                    value={searchPointage}
                    onChange={(e) => setSearchPointage(e.target.value)}
                    placeholder="Rechercher agent, matricule, date, heure..."
                    className="w-full"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Total: {pointages.length} | Resultats: {filteredPointages.length}
                </p>
              </div>

              <div className="overflow-x-auto">
                <Table className="w-full text-sm">
                  <TableHeader className="border-b text-muted-foreground">
                    <TableRow>
                      <TableCell className="text-left py-2">Agent</TableCell>
                      <TableCell className="text-left py-2">Matricule</TableCell>
                      <TableCell className="text-left py-2">Date</TableCell>
                      <TableCell className="text-left py-2">Heure</TableCell>
                      <TableCell className="text-left py-2">Type</TableCell>
                      <TableCell className="text-left py-2">Source</TableCell>
                      <TableCell className="text-left py-2">Note</TableCell>
                      <TableCell className="text-left py-2">Modifie par</TableCell>
                      {canUpdatePointages && (
                        <TableCell className="text-left py-2">Action</TableCell>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPointages.map((item) => (
                      <TableRow key={item.id} className="border-b">
                        <TableCell>
                          {item.agent.nom} {item.agent.prenom}
                        </TableCell>
                        <TableCell>{item.agent.matricule}</TableCell>
                        <TableCell>{formatDate(item.date)}</TableCell>
                        <TableCell>{formatTime(item.heurePointage)}</TableCell>
                        <TableCell>
                          <Badge variant={item.type === "ARRIVEE" ? "default" : "secondary"}>
                            {item.type === "ARRIVEE" ? "Arrivee" : "Depart"}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.source || "--"}</TableCell>
                        <TableCell>{item.note || "--"}</TableCell>
                        <TableCell>
                          {item.updatedById ?? item.createdById ?? "--"}
                        </TableCell>
                        {canUpdatePointages && (
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                              Corriger
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {paginatedPointages.length === 0 && (
                      <TableRow>
                        <TableCell
                          className="py-4 text-center text-muted-foreground"
                          colSpan={canUpdatePointages ? 9 : 8}
                        >
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
                  onClick={() => setPagePointage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPagePointage <= 1}
                >
                  Precedent
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPagePointage} / {totalPagesPointage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagePointage((prev) => Math.min(totalPagesPointage, prev + 1))
                  }
                  disabled={currentPagePointage >= totalPagesPointage}
                >
                  Suivant
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => (!open ? setEditing(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Correction de pointage</DialogTitle>
            <DialogDescription>
              La date doit rester dans la plage de travail du jour pour cet employe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Date et heure</label>
              <Input
                type="datetime-local"
                value={editDateTime}
                onChange={(e) => setEditDateTime(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Type</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editType}
                onChange={(e) => setEditType(e.target.value as "ARRIVEE" | "DEPART")}
              >
                <option value="ARRIVEE">Arrivee</option>
                <option value="DEPART">Depart</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Note (optionnel)</label>
              <Input
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Motif de correction"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)} disabled={saving}>
                Annuler
              </Button>
              <Button onClick={() => void saveEdit()} disabled={saving || !canUpdatePointages}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

