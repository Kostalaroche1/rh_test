"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { IconDotsVertical, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";

import {
  CreateTypePlanification,
  DeleteTypePlanification,
  GetTypesPlanification,
  type TypePlanificationItem,
  UpdateTypePlanification,
} from "@/app/action/planification/action";
import { useDelete, useGet, usePost, usePut } from "@/hooks/useApi";
import { useAuth } from "@/app/contexts/auth/context";
import { hasAnyPermission } from "@/security/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type FormState = {
  id?: number;
  nom: string;
  code: string;
  description: string;
};

const emptyForm: FormState = {
  nom: "",
  code: "",
  description: "",
};

export default function TableauTypesPlanification() {
  const { auth }: any = useAuth();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TypePlanificationItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data, isPending } = useGet<TypePlanificationItem[]>(
    ["types-planification"],
    GetTypesPlanification
  );

  const types = Array.isArray(data) ? data : [];

  const { mutateAsync: createType, isPending: creating } = usePost(
    CreateTypePlanification,
    ["types-planification"]
  );
  const { mutateAsync: updateType, isPending: updating } = usePut(
    UpdateTypePlanification,
    ["types-planification"]
  );
  const { mutateAsync: deleteType, isPending: deleting } = useDelete(
    DeleteTypePlanification,
    ["types-planification"]
  );

  const filteredTypes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return types;
    }

    return types.filter((item) =>
      `${item.nom} ${item.code} ${item.description ?? ""}`.toLowerCase().includes(query)
    );
  }, [search, types]);

  const totalPages = Math.max(1, Math.ceil(filteredTypes.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedTypes = useMemo(() => {
    return filteredTypes.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
  }, [currentPage, filteredTypes, pageSize]);

  const canRead = hasAnyPermission(auth, [
    "type_planification.read",
    "type_planification.create",
    "type_planification.update",
    "type_planification.delete",
  ]);
  const canManage = hasAnyPermission(auth, [
    "type_planification.create",
    "type_planification.update",
    "type_planification.delete",
  ]);

  const submitting = creating || updating;
  const isEditing = Boolean(form.id);

  function handlePageSizeChange(value: string) {
    setPageSize(Number(value));
    setPage(1);
  }

  function resetForm() {
    setForm(emptyForm);
  }

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  function openCreate() {
    resetForm();
    setDialogOpen(true);
  }

  function openEdit(item: TypePlanificationItem) {
    setForm({
      id: item.id,
      nom: item.nom ?? "",
      code: item.code ?? "",
      description: item.description ?? "",
    });
    setDialogOpen(true);
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.nom.trim() || !form.code.trim()) {
      toast.error("Le nom et le code sont obligatoires.");
      return;
    }

    try {
      if (isEditing && form.id) {
        const result: any = await updateType({
          id: form.id,
          nom: form.nom.trim(),
          code: form.code.trim().toUpperCase(),
          description: form.description.trim() || null,
        });

        if (result?.message && result?.data == null) {
          throw new Error(result.message);
        }

        toast.success("Type de planification modifie.");
      } else {
        const result: any = await createType({
          nom: form.nom.trim(),
          code: form.code.trim().toUpperCase(),
          description: form.description.trim() || null,
        });

        if (result?.message && result?.data == null) {
          throw new Error(result.message);
        }

        toast.success("Type de planification cree.");
      }

      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error?.message ?? "Operation impossible.");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    try {
      const result: any = await deleteType({ id: deleteTarget.id });
      if (result?.message && result?.success !== true) {
        throw new Error(result.message);
      }
      toast.success("Type de planification supprime.");
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error(error?.message ?? "Suppression impossible.");
    }
  }

  if (!canRead) {
    return (
      <div className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        Aucun acces sur les types de planification.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher un type de planification..."
          className="w-full md:max-w-sm"
        />

        {canManage && (
          <Button type="button" onClick={openCreate}>
            <IconPlus className="mr-2 h-4 w-4" />
            Ajouter un type
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Statut</TableHead>
            {canManage && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {!isPending &&
            paginatedTypes.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.nom}</TableCell>
                <TableCell>{item.code}</TableCell>
                <TableCell>{item.description || "--"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={item.actif ? "default" : "secondary"}>
                      {item.actif ? "Actif" : "Inactif"}
                    </Badge>
                    {item.systeme && <Badge variant="outline">Systeme</Badge>}
                  </div>
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <IconDotsVertical />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(item)}>
                          <IconPencil className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteTarget(item)}
                          disabled={item.systeme}
                        >
                          <IconTrash className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}

          {!isPending && filteredTypes.length === 0 && (
            <TableRow>
              <TableCell colSpan={canManage ? 5 : 4} className="text-center text-muted-foreground">
                Aucun type de planification trouve.
              </TableCell>
            </TableRow>
          )}

          {isPending && (
            <TableRow>
              <TableCell colSpan={canManage ? 5 : 4} className="text-center text-muted-foreground">
                Chargement...
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {!isPending && filteredTypes.length > 0 && (
        <div className="flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Lignes par page</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="h-8 w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span>
              {filteredTypes.length} element{filteredTypes.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={currentPage === 1}
            >
              Premier
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Precedent
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
            >
              Suivant
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={currentPage >= totalPages}
            >
              Dernier
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Modifier un type de planification" : "Ajouter un type de planification"}
            </DialogTitle>
            <DialogDescription>
              Les types servent a classer les planifications RH par nature metier.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={submitForm}>
            <div className="space-y-2">
              <Label htmlFor="nom-type-planification">Nom</Label>
              <Input
                id="nom-type-planification"
                value={form.nom}
                onChange={(event) => setForm((current) => ({ ...current, nom: event.target.value }))}
                placeholder="Ex: Formation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code-type-planification">Code</Label>
              <Input
                id="code-type-planification"
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                placeholder="Ex: FORMATION"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description-type-planification">Description</Label>
              <Textarea
                id="description-type-planification"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Expliquez l'usage de ce type."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Traitement..." : isEditing ? "Modifier" : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce type ?</AlertDialogTitle>
            <AlertDialogDescription>
              La suppression sera refusee si ce type est systeme ou deja utilise dans des planifications.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                confirmDelete();
              }}
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
