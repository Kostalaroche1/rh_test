'use client'

// gabriel code 

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, FileText, Download, BarChart2, Trash2, Calendar, Pencil } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"


import jsPDF from "jspdf"
import "jspdf-autotable"

import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Bar, Legend } from "recharts"
import { useAuth } from "@/app/contexts/auth/context"
import { getPaiesByAgent } from "@/app/action/paie/getPaiesByAgents/action"
import { useGet, useGet_ } from "@/hooks/useApi"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { AddDemandeConge, DeletDemandeConge, GetDemandeConge, UpdateDemandeConge } from "@/app/action/conge/demandeconge/action"
import { DemandeConge, emptyDemande, TypeConge } from "@/utilities/type"
import { GetVacance } from "@/app/action/conge/action"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { GetDashAgent } from "@/app/action/agent/dash/action"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "../../presence/ChiefPresence"
import { getStatutBadgeColor, getStatutValue } from "@/components/dashboard/chefServiceDashBoard/publicMethod"
import { formaDate, TypeCongeSelect } from "@/components/dashboard/chefServiceDashBoard/TypeCongeSelect"
import { toast } from "sonner"

export default function AgentDemandeConge() {
    const PAGE_SIZE = 14
    const [openDialog, setOpenDialog] = useState(false)
    const [selectedBulletin, setSelectedBulletin] = useState<any>(null)
    const [bulletins, setBulletins] = useState<any[]>([])

    const { auth, setAuth, isPending }: any = useAuth() // Agent connecté

    const [openNewDemandeConge, setOpenNewDemandeConge] = useState(false);
    const [openNewModifyDemandeConge, setOpenNewModifyDemandeConge] = useState(false);
    const [openNewDeleteDemandeConge, setOpenNewDeleteDemandeConge] = useState(false);
    const [demandes, setDemandes] = useState<any[]>([])
    const [typeHoliday, setTypeHoliday] = useState<TypeConge[]>([])
    const [demande, setDemande] = useState<DemandeConge>(emptyDemande)
    const { data: stats, isPending: isPendingDash } = useGet(['agentDash'], GetDashAgent)
    const [loadingId, setLoadingId] = useState<any>(null)
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)

    // const GetDemande = async () => {

    //     const data = await GetDemandeConge()
    //     const typeCongeData = await GetVacance()
    //     setTypeHoliday(typeCongeData.getData.reverse())
    //     console.log(data.getData, "data inside getDemande function", typeCongeData)
    //     setDemandes(data.getData.reverse())

    // }

    // useEffect(() => {
    //     const loadData = async () => {
    //         await GetDemande()
    //     }

    //     loadData()
    // }, [])


    // const ReccordAskForHoliday = async (formData: FormData) => {

    //     const dateDebut = formData.get("dateDebut")
    //     const dateFin = formData.get("dateFin")
    //     const motif = formData.get("motif")
    //     const dateDemande = formData.get("dateDemande")
    //     const typeCongeId = formData.get("typeCongeId")
    //     const askConge = { dateDebut, dateFin, dateDemande, motif, typeCongeId }
    //     console.log(typeCongeId, "formdata  nest recorAskfor holiday", formData)

    //     if (!typeCongeId) {
    //         return alert("vous devez choisir type congé")
    //     }
    //     const data = await AddDemandeConge(askConge)
    //     if (!data) {
    //         return
    //     }
    //     await GetDemande()
    //     setOpenNewDemandeConge(false)

    // }

    // const handleAsKHoliday = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    //     const { name, value } = e.target
    //     setDemande((demande: any) => (
    //         {
    //             ...demande,
    //             [name]: value
    //         }
    //     ))
    // }

    // const ModifyAskForHoliday = async (e: React.ChangeEvent) => {
    //     e.preventDefault()
    //     alert("here it is")
    //     const data = await UpdateDemandeConge(demande)
    //     if (!data) {
    //         console.log(data, "formdata  nest recordAskfor holiday")
    //     }
    //     console.log(data, "formdata  nest recordAskfor holiday")

    //     GetDemande()
    //     setOpenNewModifyDemandeConge(false)

    // }

    // const deleteAskHoliday = async () => {

    //     const data = await DeletDemandeConge(demande)

    //     console.log(data)
    //     if (!data) {
    //         return "wrong"
    //     }
    //     await GetDemande()
    //     setOpenNewDeleteDemandeConge(false)

    // }

    // useEffect(() => {
    //     const loadData = async () => {
    //         await GetDemande()
    //     }
    //     loadData()
    // }, [])
    // // Récupère les bulletins de l'agent


    // PDF complet
    const generatePDF = () => {
        const bulletin = selectedBulletin
        if (bulletin) {
            console.log(selectedBulletin, "Bulletin de paie")

        }
    }




    const getDemande = async () => {

        const data = await GetDemandeConge()
        const typeCongeData = await GetVacance()
        setTypeHoliday(typeCongeData.getData.reverse())
        console.log(data.getData, "data inside getDemande composant", typeCongeData)
        setDemandes(data.getData.reverse())

    }

    useEffect(() => {
        const loadData = async () => {
            await getDemande()
        }

        loadData()
    }, [])

    const filteredDemandes = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) {
            return demandes
        }

        return demandes.filter((item: any) => {
            const agent = `${item?.agent?.nom || ""} ${item?.agent?.prenom || ""}`.toLowerCase()
            const dateDebut = formaDate(item?.dateDebut).toLowerCase()
            const dateFin = formaDate(item?.dateFin).toLowerCase()
            const typeConge = item?.typeConge?.libelle?.toLowerCase() || ""
            const statut = item?.statut?.toLowerCase() || ""

            return (
                agent.includes(query) ||
                dateDebut.includes(query) ||
                dateFin.includes(query) ||
                typeConge.includes(query) ||
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


    const ReccordAskForHoliday = async (formData: FormData) => {
        setLoadingId(demande.id)

        const toastId = toast.loading("enregistrement en cours ...")

        try {

            const dateDebut = formData.get("dateDebut")
            const dateFin = formData.get("dateFin")
            const motif = formData.get("motif")
            const dateDemande = formData.get("dateDemande")
            const typeCongeId = formData.get("typeCongeId")
            const askConge = { dateDebut, dateFin, dateDemande, motif, typeCongeId }
            if (!typeCongeId) {
                setLoadingId(null)
                toast.warning("vous devez choisir type congé")
                return
            }
            const data = await AddDemandeConge(askConge)
            console.log(typeCongeId, "formdata  nest recorAskfor holiday and data", data)

            if (!data.success) {
                toast.error(data.message, { id: toastId })
                setLoadingId(null)
                return
            }

            toast.success(" demande congé enregistrement avec success", { id: toastId })
            await getDemande()
            setLoadingId(null)
            setOpenNewDemandeConge(false)
        } catch (error) {
            setLoadingId(null)
            toast.error("error serveur", { id: toastId })
        }

    }

    const handleAsKHoliday = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setDemande((demande: any) => (
            {
                ...demande,
                [name]: value
            }
        ))
    }

    const ModifyAskForHoliday = async (e: React.ChangeEvent) => {
        e.preventDefault()
        setLoadingId(demande.id)

        const toastId = toast.loading("Validation de congé en cours ...")

        try {
            if (!demande?.id) {
                toast.warning("demande manquant", { id: toastId })
                setLoadingId(null)
                return;
            }
            const data = await UpdateDemandeConge(demande);


            if (!data.success) {
                toast.error(data.message, { id: toastId })
                setLoadingId(null)
                return
            }
            console.log(data, 'data from database nest handleconfirm function')
            await getDemande();
            setLoadingId(null)
            setOpenNewModifyDemandeConge(false)
            toast.success("Validation de congé a été fait avec succès.", { id: toastId })
        } catch (error) {
            toast.error("Impossible le congé, ressayé.", { id: toastId })
            setLoadingId(null)

        } finally {
            setLoadingId(null)
        }
    }

    const deleteAskHoliday = async () => {

        const data = await DeletDemandeConge(demande)

        console.log(data)
        if (!data) {
            return "wrong"
        }
        await getDemande()
        setOpenNewDeleteDemandeConge(false)

    }



    return (
        <>
            {/* CONGÉS, DEMANDE CONDE AGENT */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                <Button variant="outline" className="w-full sm:w-auto" onClick={() => setOpenNewDemandeConge(true)}>
                    <Calendar className="w-5 h-5 mr-2" />Nouvelle Demande Congé
                </Button>
            </div>
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Demandes de congé</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher nom, date, type, statut..."
                            className="w-full md:max-w-sm"
                        />
                        <p className="text-sm text-muted-foreground">
                            Total: {demandes.length} | Resultats: {filteredDemandes.length}
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow >
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Date de début</TableHead>
                                    <TableHead>Date de fin</TableHead>
                                    <TableHead>Type de congé</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedDemandes.map((demande, idx) => (
                                    <TableRow key={idx} className="hover:bg-muted/50" >
                                        <TableCell>{demande.agent.nom}</TableCell>
                                        <TableCell>{formaDate(demande.dateDebut)}</TableCell>
                                        <TableCell>{formaDate(demande.dateFin)}</TableCell>
                                        <TableCell>{demande.typeConge.libelle}</TableCell>
                                        <TableCell> <Badge className={getStatutBadgeColor(demande.statut)}>{demande.statut}</Badge> </TableCell>
                                        <TableCell className="flex items-center gap-2 justify-end">
                                            <Button variant="outline" size="sm" disabled={getStatutValue(demande.statut, "agent")}
                                                onClick={() => {
                                                    setOpenNewModifyDemandeConge(true)
                                                    console.log(typeHoliday, "type holiday iside modify button")
                                                    setDemande({
                                                        dateDebut: demande.dateDebut,
                                                        dateFin: demande.dateFin,
                                                        dateDemande: demande.dateDemande,
                                                        motif: demande.motif,
                                                        id: demande.id,
                                                        typeConge: demande.typeConge,
                                                        statut: demande.statut,
                                                        agent: demande.agent,
                                                        role: "agent"
                                                    })
                                                }}
                                            >modifier <Pencil className="w-4 h-4" /></Button>
                                            <Button variant="outline" size="sm"
                                                disabled={getStatutValue(demande.statut, "agent")}
                                                onClick={() => {
                                                    setOpenNewDeleteDemandeConge(true)
                                                    console.log(typeHoliday, "type holiday iside modify button")
                                                    setDemande({
                                                        dateDebut: demande.dateDebut,
                                                        dateFin: demande.dateFin,
                                                        dateDemande: demande.dateDemande,
                                                        motif: demande.motif,
                                                        id: demande.id,
                                                        typeConge: demande.typeConge,
                                                        statut: demande.statut,
                                                        agent: demande.agent,
                                                        role: "agent"
                                                    })
                                                }}
                                            >delete  <Trash2 className="w-4 h-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {paginatedDemandes.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-4 text-center text-muted-foreground">
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

            {/* form create askHoliday */}
            <Dialog open={openNewDemandeConge} onOpenChange={setOpenNewDemandeConge}>
                <DialogContent className="w-full max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Faire une demande de congé</DialogTitle>
                    </DialogHeader>

                    <form className="flex flex-col gap-4" action={ReccordAskForHoliday}>
                        {/* Dates début / fin */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="dateDebut">Date de début</Label>
                                <Input
                                    id="dateDebut"
                                    type="date"
                                    name="dateDebut"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="dateFin">Date de fin</Label>
                                <Input
                                    id="dateFin"
                                    type="date"
                                    name="dateFin"
                                    required
                                />
                            </div>
                        </div>

                        {/* Date de demande */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="dateDemande">Date de la demande</Label>
                                <Input
                                    id="dateDemande"
                                    type="date"
                                    name="dateDemande"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <div className="flex flex-col gap-2">
                                    <Label>Type de congé</Label>

                                    <Select name="typeCongeId">
                                        <SelectTrigger>
                                            <SelectValue placeholder={demande.typeConge.libelle} />
                                        </SelectTrigger>

                                        <SelectContent>
                                            {typeHoliday.map((type) => (
                                                <SelectItem key={type.id} value={String(type.id)}>
                                                    {type.libelle}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        {/* Motif */}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="motif">Motif</Label>
                            <Textarea
                                id="motif"
                                name="motif"
                                placeholder="Raison de la demande de congé"
                                className="min-h-[100px] resize-none"
                                required
                            />
                        </div>

                        <Button type="submit" className="mt-2 w-full sm:w-fit"
                            disabled={loadingId === demande.id}

                        >
                            Créer
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
            {/* modify AskHoliday */}
            <Dialog open={openNewModifyDemandeConge} onOpenChange={setOpenNewModifyDemandeConge}>
                <DialogContent className="w-full max-w-lg">
                    <DialogHeader>
                        <DialogTitle>modifier  une demande de congé</DialogTitle>
                    </DialogHeader>

                    <form className="flex flex-col gap-4" onSubmit={ModifyAskForHoliday}>

                        {/* Dates début / fin */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="dateDebut">Date de début</Label>
                                <Input
                                    id="dateDebut"
                                    type="date"
                                    name="dateDebut"
                                    value={formaDate(demande.dateDebut)}
                                    onChange={handleAsKHoliday}
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="dateFin">Date de fin</Label>
                                <Input
                                    id="dateFin"
                                    type="date"
                                    name="dateFin"
                                    value={formaDate(demande.dateFin)}
                                    onChange={handleAsKHoliday}
                                    required
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                            {/* Date de demande */}
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="dateDemande">Date de la demande</Label>
                                <Input
                                    id="dateDemande"
                                    type="date"
                                    name="dateDemande"
                                    value={formaDate(demande.dateDemande)}
                                    onChange={handleAsKHoliday}
                                    required
                                />
                            </div>
                            <div>
                                {/* <TypeCongeSelect typeConges={typeHoliday} /> */}
                                <TypeCongeSelect
                                    typeConges={typeHoliday}
                                    value={demande?.typeConge.id}
                                    onChange={(type) => {
                                        setDemande((prev) =>
                                            prev
                                                ? {
                                                    ...prev,
                                                    typeConge: type,
                                                }
                                                : prev
                                        )
                                    }}
                                />

                            </div>
                        </div>
                        {/* Motif */}
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="motif">Motif</Label>
                            <Textarea
                                id="motif"
                                name="motif"
                                placeholder="Raison de la demande de congé"
                                className="min-h-[100px] resize-none"
                                value={demande.motif}
                                onChange={handleAsKHoliday}
                                required
                            />
                        </div>

                        <Button type="submit" className="mt-2 w-full sm:w-fit"
                            disabled={loadingId === demande.id}
                        >
                            modifier
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* DELETE DEMANDE CONGE */}
            <Dialog open={openNewDeleteDemandeConge} onOpenChange={setOpenNewDeleteDemandeConge}>
                <DialogContent className="w-full max-w-lg">
                    <DialogHeader>
                        <small> voulez-vous  supprimer la demande de congé du congé de <strong>{demande.typeConge.code} </strong>
                            avec motif <strong> {demande.motif}.</strong><br />
                            la demande a été faite a la date du <strong>{formaDate(demande.dateDemande)} </strong>
                            si vous ne voulez pas executer cette action fermer la fenetre actuelle en cliquant sur la petite croix (x) </small>
                    </DialogHeader>
                    <div className="flex flex-col gap-4" >
                        {/* Dates début / fin */}

                        <Button type="submit" className="mt-2 w-full sm:w-fit"
                            // disabled={}
                            onClick={deleteAskHoliday}
                        >
                            confirmer
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>)
}
