"use client"

// gabriel code

import { useEffect, useMemo, useState } from "react"
import { GetVacance } from "@/app/action/conge/action"
import { Button } from "@/components/ui/button"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { TypeConge } from "@/utilities/type"
import { TypeCongeListAdmin } from "../../chefServiceDashBoard/publicMethod"

const PAGE_SIZE = 14

export default function AdminTypeCOnge() {
  const [typeHolidays, setTypeHolidays] = useState<TypeConge[]>([])
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const getDemande = async () => {
    const typeCongeData = await GetVacance()
    setTypeHolidays(typeCongeData.getData)
  }

  useEffect(() => {
    getDemande()
  }, [])

  const filteredTypeHolidays = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return typeHolidays
    }

    return typeHolidays.filter((type) => {
      const libelle = type.libelle?.toLowerCase() || ""
      const code = type.code?.toLowerCase() || ""
      const duree = String(type.dureeMax || "").toLowerCase()
      const allocation = String(type.allocationConge || "").toLowerCase()
      const createur = type.createur?.login?.toLowerCase() || ""

      return (
        libelle.includes(query) ||
        code.includes(query) ||
        duree.includes(query) ||
        allocation.includes(query) ||
        createur.includes(query)
      )
    })
  }, [search, typeHolidays])

  useEffect(() => {
    setPage(1)
  }, [search])

  const totalPages = Math.max(1, Math.ceil(filteredTypeHolidays.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginatedTypes = filteredTypeHolidays.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  return (
    <>
      <CardHeader className="flex justify-between items-center mb-2">
        <CardTitle>Conges des agents</CardTitle>
      </CardHeader>
      <Separator />

      <CardContent>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher libelle, code, createur..."
            className="w-full md:max-w-sm"
          />
          <p className="text-sm text-muted-foreground">
            Total: {typeHolidays.length} | Resultats: {filteredTypeHolidays.length}
          </p>
        </div>

        <TypeCongeListAdmin typeConges={paginatedTypes} />

        {paginatedTypes.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">Aucun resultat</p>
        )}

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
    </>
  )
}
