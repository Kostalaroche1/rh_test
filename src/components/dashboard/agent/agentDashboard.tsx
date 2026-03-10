"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DataTable } from "../tabord/tables/tableUser"
import { AgentsData } from "@/utilities/data"

export function AgentDashboard() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Liste des agents</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={AgentsData as any}
            isPending={false}
            onRefresh={async () => undefined}
          />
        </CardContent>
      </Card>
    </div>
  )
}
