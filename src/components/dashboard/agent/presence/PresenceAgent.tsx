"use client"

// Gabriel code merged with Habacuk design

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, LogIn, LogOut } from "lucide-react"
import { AddPointPresence, GetPresence, GetTodayPresence, UpdatePresence } from "@/app/action/agent/presence/action"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "./ChiefPresence"
import { getStatutBadgeColor } from "../../chefServiceDashBoard/publicMethod"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { computePresenceStatus } from "@/utilities/presence"

type Presence = {
  id: number
  date: string
  heureArrivee: string | null
  heureDepart: string | null
  statut: string
}

const PAGE_SIZE = 14

export default function AgentDashPresence() {
  const [todayPresence, setTodayPresence] = useState<Presence | null>(null)
  const [history, setHistory] = useState<Presence[]>([])
  const [loading, setLoading] = useState(false)
  const [isworking, setIsworking] = useState(false)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  async function fetchToday() {
    const data: any = await GetTodayPresence()
    setIsworking(Boolean(data?.working))
    setTodayPresence(data?.getData ?? null)
  }

  async function fetchHistory() {
    const data = await GetPresence()
    setHistory(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    fetchHistory()
    fetchToday()
    const dayInterval = setInterval(() => {
      fetchToday()
    }, 10000)
    return () => clearInterval(dayInterval)
  }, [])

  async function handleCheckIn() {
    const toastId = toast.loading("Enregistrement en cours...")

    try {
      setLoading(true)
      const todayDate = new Date()
      const data = await AddPointPresence({ todayDate })

      if (!data.success) {
        toast.error(data.message, { id: toastId })
        return
      }

      await fetchToday()
      await fetchHistory()
      toast.success("Arrivee enregistree avec succes.", { id: toastId })
    } catch (error) {
      toast.error("Impossible d'enregistrer l'arrivee.", { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  async function handleCheckOut(id: number) {
    const toastId = toast.loading("Enregistrement en cours...")

    try {
      setLoading(true)
      const todayDate = new Date()
      const data = await UpdatePresence({ todayDate, id, role: "agent" })

      if (!data.success) {
        toast.error(data.message, { id: toastId })
        return
      }

      await fetchToday()
      toast.success("Depart enregistre avec succes.", { id: toastId })
    } catch (error) {
      toast.error("Impossible d'enregistrer le depart.", { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  const filteredHistory = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return history
    }

    return history.filter((item) => {
      const date = new Date(item.date).toLocaleDateString("fr-FR").toLowerCase()
      const arrivee = item.heureArrivee
        ? new Date(item.heureArrivee).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }).toLowerCase()
        : "--"
      const depart = item.heureDepart
        ? new Date(item.heureDepart).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }).toLowerCase()
        : "--"
      const statut = computePresenceStatus(item).toLowerCase()

      return (
        date.includes(query) ||
        arrivee.includes(query) ||
        depart.includes(query) ||
        statut.includes(query)
      )
    })
  }, [history, search])

  useEffect(() => {
    setPage(1)
  }, [search])

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  return (
    <div className="flex w-full flex-col gap-4">
      <Card className="w-full max-w-2xl self-center">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={20} />
            Presence du jour
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isworking ? (
            <>
              {todayPresence ? (
                <>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{computePresenceStatus(todayPresence)}</Badge>
                    <div className="text-sm text-muted-foreground">{formatDate(todayPresence.date)}</div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p>
                      Arrivee :{" "}
                      {todayPresence.heureArrivee
                        ? new Date(todayPresence.heureArrivee).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "--"}
                    </p>
                    <p>
                      Depart :{" "}
                      {todayPresence.heureDepart
                        ? new Date(todayPresence.heureDepart).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "--"}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    {!todayPresence.heureArrivee && (
                      <Button onClick={handleCheckIn} disabled={loading}>
                        <LogIn size={16} className="mr-2" />
                        Pointer arrivee
                      </Button>
                    )}

                    {todayPresence.heureArrivee && !todayPresence.heureDepart && (
                      <Button onClick={() => handleCheckOut(todayPresence.id)} disabled={loading}>
                        <LogOut size={16} className="mr-2" />
                        Pointer depart
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <Button onClick={handleCheckIn} disabled={loading}>
                  <LogIn size={16} className="mr-2" />
                  Pointer arrivee
                </Button>
              )}
            </>
          ) : (
            "l'heure actuelle est off. les heure de travail est entre 8:00 a 16:00"
          )}
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Historique des presences</CardTitle>
          <CardDescription>suivi et confirmation des presences par agent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher date, heure, statut..."
              className="w-full md:max-w-sm"
            />
            <p className="text-sm text-muted-foreground">
              Total: {history.length} | Resultats: {filteredHistory.length}
            </p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Arrivee</TableHead>
                <TableHead>Depart</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedHistory.map((item) => (
                <TableRow key={item.id} className="border-b">
                  <TableCell className="py-2">{new Date(item.date).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell>
                    {item.heureArrivee
                      ? new Date(item.heureArrivee).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      : "--"}
                  </TableCell>
                  <TableCell>
                    {item.heureDepart
                      ? new Date(item.heureDepart).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      : "--"}
                  </TableCell>
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
                </TableRow>
              ))}
              {paginatedHistory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-4 text-center text-muted-foreground">
                    Aucun resultat
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

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
