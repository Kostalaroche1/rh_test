"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, LogIn, LogOut } from "lucide-react"
// import { format } from "date-fns"
import { AddPointPresence, GetPresence, UpdatePresence } from "@/app/action/agent/presence/action"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useGet, usePost } from "@/hooks/useApi"

type Presence = {
    id: number
    date: string
    heureArrivee: string | null
    heureDepart: string | null
    statut: string
}

export default function AgentDashPresence() {
    const { data: todayPresence = [] , isPending: isPendingTodayPresence, refetch: refetchToday } = useGet(['PresenceToDay'], GetPresence)
    const { mutateAsync: addPointPresence, isPending: isPendingAddPresence } = usePost(AddPointPresence)
    const { mutateAsync: updatePresence, isPending: isPendingUpdatePresence } = usePost(UpdatePresence)
    let todayPresences   = todayPresence[todayPresence.length - 1]
    console.log(todayPresences)

    async function handleCheckIn() {
        const todayDate = new Date()
        const data = await addPointPresence({ todayDate })
        if (data) {
            return
        }
        refetchToday()
    }

    async function handleCheckOut(id: number) {

        const todayDate = new Date()
        const data = await updatePresence({ todayDate, id, role: "agent" })

        if (data) {
            return
        }
        refetchToday()
    }

    return (
        <div className="flex grid-col-2 gap-2 w-full">
            {/* Today Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock size={20} />
                        Présence du jour
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                    {todayPresence ? (
                        <>
                           {todayPresences?.statut ?
                           <div className="flex items-center justify-between">
                                <Badge variant="outline">
                                    {todayPresences?.statut}
                                </Badge>
                                <div className="text-sm text-muted-foreground">
                                    {new Date(todayPresences?.date).toLocaleDateString()}
                                </div >
                            </div> : ''} 

                            <div className="space-y-1 text-sm">
                                <p>
                                    Arrivée :{" "}
                                    {todayPresences?.heureArrivee
                                        ? new Date(todayPresences?.heureArrivee)
                                            .toLocaleTimeString("fr-FR", {
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })
                                        : "--"}
                                </p>
                                <p>
                                    Départ :{" "}
                                    {todayPresences?.heureDepart
                                        ? new Date(todayPresences?.heureDepart)
                                            .toLocaleTimeString("fr-FR", {
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })
                                        : "--"}
                                </p>
                            </div>

                            <div className="flex gap-3">
                                {!todayPresences?.heureArrivee && (
                                    <Button
                                        onClick={handleCheckIn}
                                        disabled={isPendingTodayPresence}
                                    >
                                        <LogIn size={16} className="mr-2" />
                                        Pointer arrivée
                                    </Button>
                                )}

                                {todayPresences?.heureArrivee && !todayPresences?.heureDepart && (
                                    <Button
                                        onClick={() => handleCheckOut(todayPresences?.id)}
                                        disabled={isPendingTodayPresence}
                                    >
                                        <LogOut size={16} className="mr-2" />
                                        Pointer départ
                                    </Button>
                                )}
                            </div>
                        </>
                    ) : (
                        <Button onClick={handleCheckIn} disabled={isPendingTodayPresence}>
                            Pointer arrivée
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* History Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Historique des présences</CardTitle>
                    <CardDescription>suivi et confirmation des presences par agent</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Arrivée</TableHead>
                                <TableHead>Départ</TableHead>
                                <TableHead>Statut</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {
                                todayPresence ?
                                 todayPresence.map((item) => (
                                    <TableRow key={item.id} className="border-b">
                                        <TableCell className="py-2">
                                            {/* {format(new Date(item.date), "dd/MM/yyyy")} */}
                                            {new Date(item.date).toLocaleDateString("fr-FR")}
                                        </TableCell>
                                        <TableCell>
                                            {/* {item.heureArrivee
                                                ? format(new Date(item.heureArrivee), "HH:mm")
                                                : "--"} */}
                                            {
                                                item.heureArrivee ? new Date(item.heureArrivee)
                                                    .toLocaleTimeString("fr-FR", {
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    })
                                                    : "--"
                                            }
                                        </TableCell>
                                        <TableCell>
                                            {/* {item.heureDepart
                                                ? format(new Date(item.heureDepart), "HH:mm")
                                                : "--"} */}
                                            {
                                                item.heureDepart ? new Date(item.heureDepart).
                                                    toLocaleTimeString("fr-FR",
                                                        {
                                                            hour: "2-digit",
                                                            minute: "2-digit"
                                                        }
                                                    ) : "--"
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{item.statut}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                                 : "..."
                               }
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
