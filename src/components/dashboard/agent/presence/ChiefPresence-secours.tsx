"use client"
// Habacuk code
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"
import { GetPresence, UpdatePresence } from "@/app/action/agent/presence/action"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"

type TeamPresence = {
    id: number
    agent: {
        nom: string
        prenom: string
    }
    date: string
    heureArrivee: string | null
    heureDepart: string | null
    statut: string
}

const data = [
    {
        id: 1,
        agent: { nom: "KOSTA", prenom: "Jean" },
        date: "2026-02-12",
        heureArrivee: "2026-02-12T08:10:00.000Z",
        heureDepart: null,
        statut: "BROUILLON",
    },
    {
        id: 2,
        agent: { nom: "Mbuyi", prenom: "Paul" },
        date: "2026-02-12",
        heureArrivee: "2026-02-12T08:00:00.000Z",
        heureDepart: "2026-02-12T17:00:00.000Z",
        statut: "CONFIRME",
    },
    {
        id: 3,
        agent: { nom: "Ilunga", prenom: "Marc" },
        date: "2026-02-12",
        heureArrivee: null,
        heureDepart: null,
        statut: "ABSENT",
    },
]

export default function ChefTeamPresence() {
    const [presences, setPresences] = useState<TeamPresence[]>([])
    const [loadingId, setLoadingId] = useState<number | null>(null)



    async function fetchPresences() {
        // const res = await fetch("/api/chef/presence/today")
        // const data = await res.json()
        const data = await GetPresence()
        console.log(data, "data from get presence nest fetcPresence function")
        if (!data) {
            return
        }
        setPresences(data)
    }

    useEffect(() => {
        async function datapresence() {
            fetchPresences()
        }
        datapresence()
    }, [])

    async function handleConfirm(id: number) {
        setLoadingId(id)
        const todayDate = new Date()

        const data = await UpdatePresence({ id, role: "chiefservice", todayDate })
        console.log(data, 'data from database nest handleconfirm function')
        await fetchPresences()
        setLoadingId(null)
    }

    function formatTime(time: string | null) {
        if (!time) return "--"

        return new Date(time).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    function getBadgeVariant(statut: string) {
        switch (statut) {
            case "VALIDE":
                return "default"
            case "CONFIRME":
                return "secondary"
            case "ABSENT":
                return "destructive"
            case "CONGE":
                return "outline"
            default:
                return "outline"
        }
    }

    return (
        <div className="p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Présences de mon service (Aujourd’hui)</CardTitle>
                </CardHeader>

                <CardContent>
                    <div className="overflow-x-auto">
                        <Table className="w-full text-sm">
                            <TableHeader className="border-b text-muted-foreground">
                                <TableRow>
                                    <TableCell className="text-left py-2">Agent</TableCell>
                                    <TableCell className="text-left py-2">Arrivée</TableCell>
                                    <TableCell className="text-left py-2">Départ</TableCell>
                                    <TableCell className="text-left py-2">Statut</TableCell>
                                    <TableCell className="text-left py-2">Action</TableCell>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {presences.map((item) => (
                                    <TableRow key={item.id} className="border-b">
                                        <TableCell className="py-2">
                                            {item.agent.nom} {item.agent.prenom}
                                        </TableCell>

                                        <TableCell>{formatTime(item.heureArrivee)}</TableCell>
                                        <TableCell>{formatTime(item.heureDepart)}</TableCell>

                                        <TableCell>
                                            <Badge variant={getBadgeVariant(item.statut)}>
                                                {item.statut}
                                            </Badge>
                                        </TableCell>

                                        <TableCell>
                                            {item.statut === "BROUILLON" && (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => handleConfirm(item.id)}
                                                    disabled={loadingId === item.id}
                                                >
                                                    <CheckCircle size={14} className="mr-1" />
                                                    {"Confirmer"}
                                                </Button>
                                            )}

                                            {item.statut !== "BROUILLON" && (
                                                <span className="text-muted-foreground text-xs">
                                                    —
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
