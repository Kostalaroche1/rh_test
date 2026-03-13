"use client";

import { useEffect, useMemo, useState } from "react";
import { CrossIcon } from "lucide-react";
import { toast } from "sonner";

import { AddConge, DeleteConge, GetVacance, UpdateTypeConge } from "@/app/action/conge/action";
import { useAuth } from "@/app/contexts/auth/context";
import { Button } from "@/components/ui/button";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { hasAnyPermission } from "@/security/permissions";
import { TypeConge } from "@/utilities/type";
import { TypeCongeList } from "../../chefServiceDashBoard/TabList";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function RhTypeConge() {
  const { auth }: any = useAuth();
  const PAGE_SIZE = 14;
  const [openNewConge, setOpenNewConge] = useState(false);
  const [typeHolidays, setTypeHolidays] = useState<TypeConge[]>([]);
  const [selectedType, setSelectedType] = useState<TypeConge | null>(null);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loadingId, setLoadingId] = useState<number | string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const canReadTypeConge = hasAnyPermission(auth, ["type_conge.read", "type_conge.create", "type_conge.update", "type_conge.delete"]);
  const canManageTypeConge = hasAnyPermission(auth, ["type_conge.create", "type_conge.update", "type_conge.delete"]);

  async function loadTypes() {
    const response = await GetVacance();
    setTypeHolidays(Array.isArray(response?.getData) ? response.getData : []);
  }

  useEffect(() => {
    loadTypes();
  }, []);

  const filteredTypeHolidays = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return typeHolidays;
    return typeHolidays.filter((type) => {
      const code = type.code?.toLowerCase() || "";
      const libelle = type.libelle?.toLowerCase() || "";
      const duree = String(type.dureeMax || "").toLowerCase();
      const allocation = String(type.allocationConge || "").toLowerCase();
      return code.includes(query) || libelle.includes(query) || duree.includes(query) || allocation.includes(query);
    });
  }, [search, typeHolidays]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredTypeHolidays.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedTypeHolidays = filteredTypeHolidays.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  async function recordHoliday(formData: FormData) {
    const toastId = toast.loading("Enregistrement en cours...");
    setLoadingId("record");
    try {
      const payload = {
        code: formData.get("code"),
        libelle: formData.get("libelle"),
        dureeMax: formData.get("dureeMax"),
        allocationConge: formData.get("allocation"),
      };
      const response: any = await AddConge(payload);
      if (!response?.success) {
        toast.warning(response?.message ?? "Operation impossible", { id: toastId });
        return;
      }
      toast.success(response.message, { id: toastId });
      setOpenNewConge(false);
      await loadTypes();
    } catch {
      toast.error("Erreur serveur", { id: toastId });
    } finally {
      setLoadingId(null);
    }
  }

  async function editTypeConge(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedType) return;
    const toastId = toast.loading("Modification en cours...");
    setLoadingId(selectedType.id);
    try {
      const response: any = await UpdateTypeConge(selectedType);
      if (!response?.success) {
        toast.error(response?.message ?? "Operation impossible", { id: toastId });
        return;
      }
      toast.success(response.message, { id: toastId });
      setOpenEditModal(false);
      await loadTypes();
    } catch {
      toast.error("Erreur serveur", { id: toastId });
    } finally {
      setLoadingId(null);
    }
  }

  async function deleteTypeConge() {
    if (!selectedId) return;
    const toastId = toast.loading("Suppression en cours...");
    setLoadingId(selectedId);
    try {
      const response: any = await DeleteConge({ id: selectedId });
      if (!response?.success) {
        toast.warning(response?.message ?? "Suppression impossible", { id: toastId });
        return;
      }
      toast.success(response.message, { id: toastId });
      setOpenDeleteConfirm(false);
      await loadTypes();
    } catch {
      toast.error("Erreur serveur", { id: toastId });
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <>
      {!canReadTypeConge ? (
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aucun acces en lecture sur les types de conge.
        </CardContent>
      ) : (
        <>
          <CardHeader className="mb-2 flex items-center justify-between">
            <CardTitle>Conges des agents</CardTitle>
            {canManageTypeConge && (
              <Button variant="outline" onClick={() => setOpenNewConge(true)}>
                <CrossIcon className="mr-2 h-4 w-4" /> Ajouter un conge
              </Button>
            )}
          </CardHeader>
          <Separator />
          <CardContent>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher code, libelle, duree..." className="w-full md:max-w-sm" />
              <p className="text-sm text-muted-foreground">Total: {typeHolidays.length} | Resultats: {filteredTypeHolidays.length}</p>
            </div>
            <TypeCongeList
              readOnly={!canManageTypeConge}
              typeConges={paginatedTypeHolidays}
              onEdit={(type) => {
                setSelectedType(type);
                setOpenEditModal(true);
              }}
              onDelete={(id) => {
                setSelectedId(id);
                setOpenDeleteConfirm(true);
              }}
            />
            {paginatedTypeHolidays.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Aucun resultat</p>}
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={currentPage <= 1}>Precedent</Button>
              <span className="text-sm text-muted-foreground">Page {currentPage} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage >= totalPages}>Suivant</Button>
            </div>
          </CardContent>

          <Dialog open={openNewConge} onOpenChange={setOpenNewConge}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un type de conge</DialogTitle>
              </DialogHeader>
              <form className="flex flex-col gap-4" action={recordHoliday}>
                <Input placeholder="Code conge ex. FORMATION" name="code" required />
                <Input placeholder="Description conge" name="libelle" required />
                <Input placeholder="Duree" type="number" name="dureeMax" required />
                <Input placeholder="Montant allocation en franc" type="number" name="allocation" required />
                <Button type="submit" className="mt-2" disabled={loadingId === "record"}>Creer</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifier type de conge</DialogTitle>
              </DialogHeader>
              {selectedType && (
                <form onSubmit={editTypeConge} className="flex flex-col gap-4">
                  <Input value={selectedType.code} onChange={(e) => setSelectedType({ ...selectedType, code: e.target.value })} />
                  <Input value={selectedType.libelle} onChange={(e) => setSelectedType({ ...selectedType, libelle: e.target.value })} />
                  <Input type="number" value={selectedType.dureeMax} onChange={(e) => setSelectedType({ ...selectedType, dureeMax: Number(e.target.value) })} />
                  <Input type="number" value={selectedType.allocationConge} placeholder="Allocation conge en franc" onChange={(e) => setSelectedType({ ...selectedType, allocationConge: Number(e.target.value) })} />
                  <Button type="submit" disabled={loadingId === selectedType.id}>Valider</Button>
                </form>
              )}
            </DialogContent>
          </Dialog>

          <AlertDialog open={openDeleteConfirm} onOpenChange={setOpenDeleteConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer ce type de conge ?</AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction disabled={loadingId === selectedId} onClick={deleteTypeConge}>Confirmer</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  );
}
