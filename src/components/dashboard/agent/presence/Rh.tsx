"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import { GetPresence, UpdatePresence } from "@/app/action/agent/presence/action"

type RHPresence = {
    id: number
    agent: {
        nom: string
        prenom: string
        service: {
            nom: string
        }
    }
    date: string
    heureArrivee: string | null
    heureDepart: string | null
    statut: string
    confirmePar?: {
        email: string
    }
}

export default function RHPresences() {
    const [presences, setPresences] = useState<RHPresence[]>([])
    const [loadingId, setLoadingId] = useState<number | null>(null)



    async function fetchPresences() {
        // const res = await fetch("/api/rh/presence")
        // const data = await res.json()
        const data = await GetPresence()
        if (!data) {
            return "error"
        }
        setPresences(data)
    }
    useEffect(() => {
        async function getDataRh() {
            fetchPresences()
        }
        getDataRh()
    }, [])
    async function handleValidate(id: number) {
        setLoadingId(id)
        const todayDate = new Date()
        const data = await UpdatePresence({ id, role: "chiefservice", todayDate })        // await fetch(`/api/rh/presence/${id}/validate`, {

        if (!data) {
            return
        }
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

    function formatDate(date: string) {
        return new Date(date).toLocaleDateString("fr-FR")
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
                    <CardTitle>Gestion globale des présences</CardTitle>
                </CardHeader>

                <CardContent>
                    <div className="overflow-x-auto">
                        <Table className="w-full text-sm">
                            <TableHeader className="border-b text-muted-foreground">
                                <TableRow>
                                    <TableCell className="text-left py-2">Agent</TableCell>
                                    <TableCell className="text-left py-2">Service</TableCell>
                                    <TableCell className="text-left py-2">Date</TableCell>
                                    <TableCell className="text-left py-2">Arrivée</TableCell>
                                    <TableCell className="text-left py-2">Départ</TableCell>
                                    <TableCell className="text-left py-2">Statut</TableCell>
                                    <TableCell className="text-left py-2">Confirmé par</TableCell>
                                    <TableCell className="text-left py-2">Action</TableCell>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {presences.map((item) => (
                                    <TableRow key={item.id} className="border-b">
                                        <TableCell className="py-2">
                                            {item.agent.nom} {item.agent.prenom}
                                        </TableCell>

                                        <TableCell>ici service peut  agent</TableCell>

                                        <TableCell>{formatDate(item.date)}</TableCell>

                                        <TableCell>{formatTime(item.heureArrivee)}</TableCell>
                                        <TableCell>{formatTime(item.heureDepart)}</TableCell>

                                        <TableCell>
                                            <Badge variant={getBadgeVariant(item.statut)}>
                                                {item.statut}
                                            </Badge>
                                        </TableCell>

                                        <TableCell>
                                            {item.confirmePar
                                                ? item.confirmePar.email
                                                : "--"}
                                        </TableCell>

                                        <TableCell>
                                            {item.statut === "CONFIRME" && (
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => handleValidate(item.id)}
                                                    disabled={loadingId === item.id}
                                                >
                                                    <CheckCircle size={14} className="mr-1" />
                                                    Valider
                                                </Button>
                                            )}

                                            {item.statut !== "CONFIRME" && (
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
