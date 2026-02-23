"use client"

import * as React from "react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataTable } from "../tabord/tables/tableUser"
import { AgentsData } from "@/utilities/data"

export function AgentDashboard() {
  // Colonnes pour la DataTable
  const columns = React.useMemo(
    () => [
      {
        accessorKey: "matricule",
        header: "Matricule",
      },
      {
        accessorKey: "nom",
        header: "Nom",
      },
      {
        accessorKey: "prenom",
        header: "Prénom",
      },
      {
        accessorKey: "role",
        header: "Rôle",
      },
      {
        accessorKey: "statut",
        header: "Statut",
      },
      {
        accessorKey: "hasAccount",
        header: "Compte",
        cell: ({ row }: any) => (row.original.hasAccount ? "Oui" : "Non"),
      },
    ],
    []
  )

  return (
    <div className="space-y-6">
      {/* Section Présence */}

      {/* Section Agents */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des agents</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={AgentsData} />
        </CardContent>
      </Card>
    </div>
  )
}
