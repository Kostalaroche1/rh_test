"use client"

// gabriel code 

import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CrossIcon } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useEffect, useMemo, useState } from "react";
import { TypeConge } from "@/utilities/type";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AddConge, DeleteConge, GetVacance, UpdateTypeConge } from "@/app/action/conge/action";
import { TypeCongeList } from "../../chefServiceDashBoard/TabList";
import { toast } from "sonner"

export default function RhTypeConge() {
    const PAGE_SIZE = 14
    const [openNewConge, setOpenNewconge] = useState(false);

    const [typeHolidays, setTypeHolidays] = useState<TypeConge[]>([])
    // type congé state
    const [selectedType, setSelectedType] = useState<TypeConge | null>(null)
    const [openEditModal, setOpenEditModal] = useState(false)
    const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false)
    const [selectedId, setSelectedId] = useState<number | null>(null)
    const [loadingId, setLoadingId] = useState<any>(null)
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)

    const Reccordholiday = async (formData: FormData) => {
        // e.preventDefault()
        const toastId = toast.loading("enregistrement encours...")
        try {
            const code = formData.get("code")
            const libelle = formData.get("libelle")
            const dureeMax = formData.get("dureeMax")
            const allocationConge = formData.get("allocation")
            setLoadingId("reccord")

            console.log(code, libelle, dureeMax, "code,libelle from action")
            const data: any = await AddConge({ code, libelle, dureeMax, allocationConge })
            console.log(code, libelle, dureeMax, "code,libelle from action", data)

            if (!data.success) {
                setLoadingId(null)
                toast.warning(data.message, { id: toastId })
                return
            }
            toast.success(data.message, { id: toastId })
            setLoadingId(null)
            await GetDemande()
            setOpenNewconge(false)
        } catch (error) {
            setLoadingId(null)
            toast.error("error serveur ", { id: toastId })
        }
    }

    const GetDemande = async () => {
        const typeCongeData = await GetVacance()
        setTypeHolidays(typeCongeData.getData)
        console.log("data inside getDemande", typeCongeData)
    }

    useEffect(() => {
        const loadData = async () => {
            await GetDemande()
        }
        loadData()
    }, [])

    const filteredTypeHolidays = useMemo(() => {
        const query = search.trim().toLowerCase()
        if (!query) {
            return typeHolidays
        }

        return typeHolidays.filter((type) => {
            const code = type.code?.toLowerCase() || ""
            const libelle = type.libelle?.toLowerCase() || ""
            const duree = String(type.dureeMax || "").toLowerCase()
            const allocation = String(type.allocationConge || "").toLowerCase()
            return (
                code.includes(query) ||
                libelle.includes(query) ||
                duree.includes(query) ||
                allocation.includes(query)
            )
        })
    }, [search, typeHolidays])

    useEffect(() => {
        setPage(1)
    }, [search])

    const totalPages = Math.max(1, Math.ceil(filteredTypeHolidays.length / PAGE_SIZE))
    const currentPage = Math.min(page, totalPages)
    const paginatedTypeHolidays = filteredTypeHolidays.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    )




    const EditTypeConge = async (e: React.ChangeEvent<HTMLElement>) => {
        e.preventDefault()
        setLoadingId(selectedType?.id)
        const toastId = toast.loading("modification en cours...")
        try {
            const data = await UpdateTypeConge(selectedType)
            console.log(data, 'data nest edit type conge before data verification ,selectedId,selectedType', selectedId, selectedType)
            if (!data.success) {
                setLoadingId(null)
                toast.error(data.message, { id: toastId })
                return
            }
            console.log(data, 'data nest edit type conge after')
            toast.success(data.message, { id: toastId })
            setLoadingId(null)
            await GetDemande()
            setOpenEditModal(false)
        } catch (error) {
            setLoadingId(null)
            toast.error("erreur serveur", { id: toastId })
            return
        }
    }
    const deleteTypeConge = async () => {
        console.log(selectedId, "selected Id nest deleteType")

        const toastId = toast.loading("suppression en cours..")

        setLoadingId(selectedId)
        try {
            const data = await DeleteConge({ id: selectedId })
            if (!data.success) {
                toast.warning(data.message, { id: toastId })
                setLoadingId(null)
                return
            }
            setLoadingId(null)

            toast.success(data.message, { id: toastId })
            await GetDemande()
            setOpenDeleteConfirm(false)
        } catch (error) {
            setLoadingId(null)

            toast.error("erreur serveur ressayer", { id: toastId })
        }
    }
    return (
        <>


            {/* AJOUT CONGE */}
            <CardHeader className="flex justify-between items-center mb-2">
                <CardTitle>Congés des agents</CardTitle>
                <Button variant="outline" onClick={() => setOpenNewconge(true)} >
                    <CrossIcon className="" /> Ajouter un congé
                </Button>
            </CardHeader>
            <Separator />
            <CardContent>
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher code, libelle, duree..."
                        className="w-full md:max-w-sm"
                    />
                    <p className="text-sm text-muted-foreground">
                        Total: {typeHolidays.length} | Resultats: {filteredTypeHolidays.length}
                    </p>
                </div>
                <TypeCongeList
                    readOnly={false}
                    typeConges={paginatedTypeHolidays}
                    onEdit={(type) => {
                        setSelectedType(type)
                        setOpenEditModal(true)
                    }}
                    onDelete={(id) => {
                        setSelectedId(id)
                        setOpenDeleteConfirm(true)
                    }}
                />
                {paginatedTypeHolidays.length === 0 && (
                    <p className="py-4 text-center text-sm text-muted-foreground">Aucun resultat</p>
                )}
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
                {/* </SelectContent>
                      </Select> */}
            </CardContent>


            <>
                {/* dialogue form create conge */}

                <Dialog open={openNewConge} onOpenChange={setOpenNewconge}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>ajouter un type de congé</DialogTitle>
                        </DialogHeader>
                        <form className="flex flex-col gap-4" action={Reccordholiday}>
                            <Input placeholder="code congé ex. FORMATION" name="code" required />
                            <Input placeholder="description congé" name="libelle" required />
                            <Input placeholder="duree" type="number" name="dureeMax" required />
                            <Input placeholder="montant allocation en franc" type="number" name="allocation" required />

                            <Button type="submit" className="mt-2"
                                disabled={loadingId === "reccord"}
                            >creer</Button>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* mODAL MODIFY (EDIT)TYPE CONGE */}
                <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Modifier Type de Congé</DialogTitle>
                        </DialogHeader>

                        {selectedType && (
                            <form
                                onSubmit={EditTypeConge}
                                className="flex flex-col gap-4"
                            >
                                <Input
                                    value={selectedType.code}
                                    onChange={(e) =>
                                        setSelectedType({
                                            ...selectedType,
                                            code: e.target.value,
                                        })
                                    }
                                />

                                <Input
                                    value={selectedType.libelle}
                                    onChange={(e) =>
                                        setSelectedType({
                                            ...selectedType,
                                            libelle: e.target.value,
                                        })
                                    }
                                />

                                <Input
                                    type="number"
                                    value={selectedType.dureeMax}
                                    onChange={(e) =>
                                        setSelectedType({
                                            ...selectedType,
                                            dureeMax: Number(e.target.value),
                                        })
                                    }
                                />
                                <Input
                                    type="number"
                                    value={selectedType.allocationConge}
                                    placeholder="allocation congé en franc"
                                    onChange={(e) =>
                                        setSelectedType({
                                            ...selectedType,
                                            allocationConge: Number(e.target.value),
                                        })
                                    }
                                />

                                <Button type="submit"
                                    disabled={loadingId === selectedType.id}
                                >Valider</Button>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* DELETE CONFIRMATION DIALOGUE */}
                <AlertDialog open={openDeleteConfirm} onOpenChange={setOpenDeleteConfirm}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Supprimer ce type de congé ?
                            </AlertDialogTitle>
                        </AlertDialogHeader>

                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                                disabled={loadingId === selectedId}
                                onClick={deleteTypeConge}
                            >
                                Confirmer
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </>
        </>

    );
}
