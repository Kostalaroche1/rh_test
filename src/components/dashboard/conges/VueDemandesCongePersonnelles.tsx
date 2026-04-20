"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AddDemandeConge, DeletDemandeConge, GetDemandeConge, UpdateDemandeConge } from "@/app/action/conge/demandeconge/action";
import { GetVacance } from "@/app/action/conge/action";
import { useAuth } from "@/app/contexts/auth/context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { hasAnyPermission } from "@/security/permissions";
import { emptyDemande, type DemandeConge, type TypeConge } from "@/utilities/type";
import { obtenirCouleurBadgeStatut, obtenirValeurStatut } from "@/components/dashboard/espaceTravail/utilitaires/statuts";
import { formatInputDate } from "@/components/dashboard/conges/SelectionTypeConge";

const PAGE_SIZE = 14;

function todayInputValue() {
  return new Date().toISOString().split("T")[0];
}

export default function AgentDemandeConge() {
  const { auth }: any = useAuth();
  const canReadDemandes = hasAnyPermission(auth, ["demande_conge.read", "demande_conge.request", "demande_conge.update", "demande_conge.delete"]);
  const canCreateDemande = hasAnyPermission(auth, ["demande_conge.request"]);
  const canManageOwnDemandes = hasAnyPermission(auth, ["demande_conge.update", "demande_conge.delete"]);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [demandes, setDemandes] = useState<DemandeConge[]>([]);
  const [typeConges, setTypeConges] = useState<TypeConge[]>([]);
  const [demande, setDemande] = useState<DemandeConge>(emptyDemande);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  async function loadData() {
    const [demandeResponse, typeCongeResponse] = await Promise.all([
      GetDemandeConge(),
      GetVacance(),
    ]);
    setDemandes(Array.isArray(demandeResponse?.getData) ? [...demandeResponse.getData].reverse() : []);
    setTypeConges(Array.isArray(typeCongeResponse?.getData) ? [...typeCongeResponse.getData].reverse() : []);
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredDemandes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return demandes;

    return demandes.filter((item) => {
      const agent = `${item.agent?.nom || ""} ${item.agent?.prenom || ""}`.toLowerCase();
      const dateDebut = formatInputDate(item.dateDebut).toLowerCase();
      const dateFin = formatInputDate(item.dateFin).toLowerCase();
      const typeConge = item.typeConge?.libelle?.toLowerCase() || "";
      const statut = item.statut?.toLowerCase() || "";
      return agent.includes(query) || dateDebut.includes(query) || dateFin.includes(query) || typeConge.includes(query) || statut.includes(query);
    });
  }, [demandes, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredDemandes.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedDemandes = filteredDemandes.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function openEditDialog(item: DemandeConge) {
    setDemande({ ...item, action: "update_own" });
    setOpenEdit(true);
  }

  function openDeleteDialog(item: DemandeConge) {
    setDemande({ ...item, action: "update_own" });
    setOpenDelete(true);
  }

  async function createDemande(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const toastId = toast.loading("Enregistrement en cours...");
    try {
      const formData = new FormData(event.currentTarget);
      const payload = {
        dateDebut: formData.get("dateDebut"),
        dateFin: formData.get("dateFin"),
        dateDemande: formData.get("dateDemande"),
        motif: formData.get("motif"),
        typeCongeId: formData.get("typeCongeId"),
      };

      if (!payload.typeCongeId) {
        toast.warning("Vous devez choisir un type de conge.", { id: toastId });
        return;
      }

      const response = await AddDemandeConge(payload);
      if (!response?.success) {
        toast.error(response?.message ?? "Operation impossible", { id: toastId });
        return;
      }

      toast.success("Demande de conge creee avec succes.", { id: toastId });
      setOpenCreate(false);
      event.currentTarget.reset();
      await loadData();
    } catch {
      toast.error("Erreur serveur", { id: toastId });
    }
  }

  async function updateDemande(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const toastId = toast.loading("Mise a jour en cours...");
    setLoadingId(demande.id);
    try {
      const response = await UpdateDemandeConge(demande);
      if (!response?.success) {
        toast.error(response?.message ?? "Operation impossible", { id: toastId });
        return;
      }
      toast.success("Demande de conge modifiee avec succes.", { id: toastId });
      setOpenEdit(false);
      await loadData();
    } catch {
      toast.error("Erreur serveur", { id: toastId });
    } finally {
      setLoadingId(null);
    }
  }

  async function deleteDemande() {
    const toastId = toast.loading("Suppression en cours...");
    setLoadingId(demande.id);
    try {
      const response = await DeletDemandeConge(demande);
      if (!response?.success) {
        toast.error(response?.message ?? "Suppression impossible", { id: toastId });
        return;
      }
      toast.success("Demande de conge supprimee avec succes.", { id: toastId });
      setOpenDelete(false);
      await loadData();
    } catch {
      toast.error("Erreur serveur", { id: toastId });
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <>
      {!canReadDemandes && (
        <Card className="w-full">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Aucun acces en lecture sur les demandes de conge.
          </CardContent>
        </Card>
      )}

      {canReadDemandes && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {canCreateDemande && (
              <Button variant="outline" className="w-full sm:w-auto" onClick={() => setOpenCreate(true)}>
                <Calendar className="mr-2 h-5 w-5" />
                Nouvelle demande de conge
              </Button>
            )}
          </div>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>Demandes de conge</CardTitle>
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
                    <TableRow>
                      <TableHead>Nom</TableHead>
                      <TableHead>Date de debut</TableHead>
                      <TableHead>Date de fin</TableHead>
                      <TableHead>Type de conge</TableHead>
                      <TableHead>Statut</TableHead>
                      {canManageOwnDemandes && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDemandes.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell>{item.agent?.nom}</TableCell>
                        <TableCell>{formatInputDate(item.dateDebut)}</TableCell>
                        <TableCell>{formatInputDate(item.dateFin)}</TableCell>
                        <TableCell>{item.typeConge?.libelle}</TableCell>
                        <TableCell>
                          <Badge className={obtenirCouleurBadgeStatut(item.statut)}>{item.statut}</Badge>
                        </TableCell>
                        {canManageOwnDemandes && (
                          <TableCell className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={obtenirValeurStatut(item.statut, "own")}
                              onClick={() => openEditDialog(item)}
                            >
                              Modifier <Pencil className="ml-1 h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={obtenirValeurStatut(item.statut, "own")}
                              onClick={() => openDeleteDialog(item)}
                            >
                              Supprimer <Trash2 className="ml-1 h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {paginatedDemandes.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={canManageOwnDemandes ? 6 : 5} className="py-4 text-center text-muted-foreground">
                          Aucun resultat
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={currentPage <= 1}>
                  Precedent
                </Button>
                <span className="text-sm text-muted-foreground">Page {currentPage} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage >= totalPages}>
                  Suivant
                </Button>
              </div>
            </CardContent>
          </Card>

          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogContent className="w-full max-w-lg">
              <DialogHeader>
                <DialogTitle>Faire une demande de conge</DialogTitle>
              </DialogHeader>
              <form className="flex flex-col gap-4" onSubmit={createDemande}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="dateDebut">Date de debut</Label>
                    <Input id="dateDebut" type="date" name="dateDebut" min={todayInputValue()} required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="dateFin">Date de fin</Label>
                    <Input id="dateFin" type="date" name="dateFin" min={todayInputValue()} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="dateDemande">Date de la demande</Label>
                    <Input id="dateDemande" type="date" name="dateDemande" defaultValue={todayInputValue()} min={todayInputValue()} required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Type de conge</Label>
                    <Select name="typeCongeId">
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un type de conge" />
                      </SelectTrigger>
                      <SelectContent>
                        {typeConges.map((type) => (
                          <SelectItem key={type.id} value={String(type.id)}>
                            {type.code} / {type.dureeMax} jours / {type.libelle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="motif">Motif</Label>
                  <Textarea id="motif" name="motif" placeholder="Raison de la demande de conge" className="min-h-[100px] resize-none" required />
                </div>
                <Button type="submit" className="mt-2 w-full sm:w-fit">Creer</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={openEdit} onOpenChange={setOpenEdit}>
            <DialogContent className="w-full max-w-lg">
              <DialogHeader>
                <DialogTitle>Modifier une demande de conge</DialogTitle>
              </DialogHeader>
              <form className="flex flex-col gap-4" onSubmit={updateDemande}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="editDateDebut">Date de debut</Label>
                    <Input id="editDateDebut" type="date" value={formatInputDate(demande.dateDebut)} onChange={(e) => setDemande((prev) => ({ ...prev, dateDebut: e.target.value }))} required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="editDateFin">Date de fin</Label>
                    <Input id="editDateFin" type="date" value={formatInputDate(demande.dateFin)} onChange={(e) => setDemande((prev) => ({ ...prev, dateFin: e.target.value }))} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="editDateDemande">Date de la demande</Label>
                    <Input id="editDateDemande" type="date" value={formatInputDate(demande.dateDemande)} onChange={(e) => setDemande((prev) => ({ ...prev, dateDemande: e.target.value }))} required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Type de conge</Label>
                    <Select value={demande.typeConge?.id ? String(demande.typeConge.id) : ""} onValueChange={(value) => {
                      const selected = typeConges.find((type) => type.id === Number(value));
                      if (selected) {
                        setDemande((prev) => ({ ...prev, typeConge: selected }));
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir un type de conge" />
                      </SelectTrigger>
                      <SelectContent>
                        {typeConges.map((type) => (
                          <SelectItem key={type.id} value={String(type.id)}>
                            {type.code} / {type.dureeMax} jours / {type.libelle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="editMotif">Motif</Label>
                  <Textarea id="editMotif" value={demande.motif || ""} onChange={(e) => setDemande((prev) => ({ ...prev, motif: e.target.value }))} className="min-h-[100px] resize-none" required />
                </div>
                <Button type="submit" className="mt-2 w-full sm:w-fit" disabled={loadingId === demande.id}>Modifier</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={openDelete} onOpenChange={setOpenDelete}>
            <DialogContent className="w-full max-w-lg">
              <DialogHeader>
                <DialogTitle>Supprimer la demande de conge</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  Voulez-vous supprimer la demande de conge <strong>{demande.typeConge?.code}</strong> avec motif <strong>{demande.motif}</strong> ?
                </p>
                <Button type="button" className="mt-2 w-full sm:w-fit" disabled={loadingId === demande.id} onClick={deleteDemande}>
                  Confirmer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
}





