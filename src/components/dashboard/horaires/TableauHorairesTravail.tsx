"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  IconDotsVertical,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconPencil,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";

import {
  AddHoraireTravail,
  DeleteHoraireTravail,
  GetHoraireTravail,
  UpdateHoraireTravail,
} from "@/app/action/horaireTravail/action";
import { useDelete, useGet, usePost, usePut } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useAuth } from "@/app/contexts/auth/context";
import { hasAnyPermission } from "@/security/permissions";

type HoraireItem = {
  id: number;
  nomHoraire: string;
  heureDebut: string;
  heureFin: string;
  _count?: {
    horaireAgent?: number;
  };
  creerPar?: {
    login?: string;
  };
};

type HoraireFormState = {
  id?: number;
  nomHoraire: string;
  heureDebut: string;
  heureFin: string;
  heureDebutHour: string;
  heureDebutMinute: string;
  heureFinHour: string;
  heureFinMinute: string;
};

const defaultForm: HoraireFormState = {
  nomHoraire: "",
  heureDebut: "",
  heureFin: "",
  heureDebutHour: "",
  heureDebutMinute: "",
  heureFinHour: "",
  heureFinMinute: "",
};

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) =>
  `${index}`.padStart(2, "0")
);
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) =>
  `${index}`.padStart(2, "0")
);

function buildTime(hour: string, minute: string) {
  if (!hour || !minute) {
    return "";
  }

  return `${hour}:${minute}`;
}

function splitTime(value: string) {
  const formatted = formatTime(value);
  if (formatted === "--:--") {
    return { hour: "", minute: "" };
  }

  const [hour, minute] = formatted.split(":");
  return { hour, minute };
}

function formatTime(value: string) {
  if (/^\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  const hours = `${date.getUTCHours()}`.padStart(2, "0");
  const minutes = `${date.getUTCMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

export default function HoraireTravailTable() {
  const { auth }: any = useAuth();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HoraireItem | null>(null);
  const [form, setForm] = useState<HoraireFormState>(defaultForm);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const { data, isPending } = useGet<HoraireItem[]>(
    ["HoraireTravailAll"],
    GetHoraireTravail
  );
  const horaires = Array.isArray(data) ? data : [];

  const { mutateAsync: createHoraire, isPending: creating } = usePost(
    AddHoraireTravail,
    ["HoraireTravailAll"]
  );
  const { mutateAsync: updateHoraire, isPending: updating } = usePut(
    UpdateHoraireTravail,
    ["HoraireTravailAll"]
  );
  const { mutateAsync: removeHoraire, isPending: deleting } = useDelete(
    DeleteHoraireTravail,
    ["HoraireTravailAll"]
  );

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return horaires;
    }

    return horaires.filter((item) =>
      `${item.nomHoraire} ${formatTime(item.heureDebut)} ${formatTime(item.heureFin)} ${item.creerPar?.login ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [horaires, search]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  const canReadHoraireTravail = hasAnyPermission(auth, [
    "horaire_travail.read",
    "horaire_travail.create",
    "horaire_travail.update",
    "horaire_travail.delete",
  ]);
  const canManageHoraireTravail = hasAnyPermission(auth, [
    "horaire_travail.create",
    "horaire_travail.update",
    "horaire_travail.delete",
  ]);

  const isEditing = Boolean(form.id);
  const submitting = creating || updating;

  function resetForm() {
    setForm(defaultForm);
  }

  function handleOpenCreate() {
    resetForm();
    setDialogOpen(true);
  }

  function handlePageSizeChange(value: string) {
    setPageSize(Number(value));
    setPage(1);
  }

  function handleOpenEdit(item: HoraireItem) {
    const start = splitTime(item.heureDebut);
    const end = splitTime(item.heureFin);

    setForm({
      id: item.id,
      nomHoraire: item.nomHoraire ?? "",
      heureDebut: buildTime(start.hour, start.minute),
      heureFin: buildTime(end.hour, end.minute),
      heureDebutHour: start.hour,
      heureDebutMinute: start.minute,
      heureFinHour: end.hour,
      heureFinMinute: end.minute,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const heureDebut = buildTime(form.heureDebutHour, form.heureDebutMinute);
    const heureFin = buildTime(form.heureFinHour, form.heureFinMinute);

    if (!form.nomHoraire.trim() || !heureDebut || !heureFin) {
      toast.error("Tous les champs sont obligatoires");
      return;
    }

    try {
      if (isEditing && form.id) {
        await updateHoraire({
          id: form.id,
          nomHoraire: form.nomHoraire.trim(),
          heureDebut,
          heureFin,
        });
        toast.success("Horaire modifie avec succes");
      } else {
        await createHoraire({
          nomHoraire: form.nomHoraire.trim(),
          heureDebut,
          heureFin,
        });
        toast.success("Horaire cree avec succes");
      }

      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error?.message ?? "Operation impossible");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      await removeHoraire({ id: deleteTarget.id });
      toast.success("Horaire supprime avec succes");
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error(error?.message ?? "Suppression impossible");
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-3">
      {!canReadHoraireTravail && (
        <div className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Aucun acces en lecture sur les horaires de travail.
        </div>
      )}
      {canReadHoraireTravail && (
      <>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          className="w-full md:max-w-sm"
          placeholder="Rechercher nom, heure, createur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {canManageHoraireTravail && (
          <Button type="button" onClick={handleOpenCreate}>
            <IconPlus className="mr-2 h-4 w-4" />
            Ajouter un horaire
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Heure debut</TableHead>
            <TableHead>Heure fin</TableHead>
            <TableHead>Affectations</TableHead>
            <TableHead>Cree par</TableHead>
            {canManageHoraireTravail && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>

        <TableBody>
          {!isPending &&
            paginatedData.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.nomHoraire}</TableCell>
                <TableCell>{formatTime(item.heureDebut)}</TableCell>
                <TableCell>{formatTime(item.heureFin)}</TableCell>
                <TableCell>{item._count?.horaireAgent ?? 0}</TableCell>
                <TableCell>{item.creerPar?.login ?? "--"}</TableCell>
                {canManageHoraireTravail && <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <IconDotsVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenEdit(item)}>
                        <IconPencil className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteTarget(item)}
                      >
                        <IconTrash className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>}
              </TableRow>
            ))}

          {!isPending && filteredData.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={canManageHoraireTravail ? 6 : 5}
                className="text-center text-muted-foreground"
              >
                Aucun horaire trouve
              </TableCell>
            </TableRow>
          )}

          {isPending && (
            <TableRow>
              <TableCell
                colSpan={canManageHoraireTravail ? 6 : 5}
                className="text-center text-muted-foreground"
              >
                Chargement...
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {!isPending && filteredData.length > 0 && (
        <div className="flex flex-col gap-3 border-t px-1 pt-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Lignes par page</span>
            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
              <SelectTrigger className="w-[84px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(1)}
              disabled={currentPage <= 1}
            >
              <IconChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
            >
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm">
              Page {currentPage} sur {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
            >
              <IconChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(totalPages)}
              disabled={currentPage >= totalPages}
            >
              <IconChevronsRight className="h-4 w-4" />
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
              {isEditing ? "Modifier un horaire" : "Creer un horaire"}
            </DialogTitle>
            <DialogDescription>
              Renseignez le nom et la plage horaire de travail.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nomHoraire">Nom horaire</Label>
              <Input
                id="nomHoraire"
                value={form.nomHoraire}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, nomHoraire: e.target.value }))
                }
                placeholder="Ex: Horaire de jour"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="heureDebut">Heure debut</Label>
                <div className="inline-flex w-fit overflow-hidden rounded-lg border border-input bg-card/50">
                  <div className="inline-grid grid-cols-[auto_auto_auto] items-center">
                    <Select
                      value={form.heureDebutHour}
                      onValueChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          heureDebutHour: value,
                          heureDebut: buildTime(value, prev.heureDebutMinute),
                        }))
                      }
                    >
                      <SelectTrigger
                        id="heureDebut"
                        className="h-11 min-w-[56px] justify-start gap-0.5 rounded-none border-0 bg-transparent px-1.5 pr-1 shadow-none focus:ring-0"
                      >
                        <SelectValue placeholder="Heure" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {HOUR_OPTIONS.map((hour) => (
                          <SelectItem key={hour} value={hour}>
                            {hour}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="px-0.5 text-sm text-muted-foreground">:</div>

                    <Select
                      value={form.heureDebutMinute}
                      onValueChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          heureDebutMinute: value,
                          heureDebut: buildTime(prev.heureDebutHour, value),
                        }))
                      }
                    >
                      <SelectTrigger className="h-11 min-w-[56px] justify-start gap-0.5 rounded-none border-0 bg-transparent px-1.5 pr-1 shadow-none focus:ring-0">
                        <SelectValue placeholder="Minute" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {MINUTE_OPTIONS.map((minute) => (
                          <SelectItem key={minute} value={minute}>
                            {minute}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="heureFin">Heure fin</Label>
                <div className="inline-flex w-fit overflow-hidden rounded-lg border border-input bg-card/50">
                  <div className="inline-grid grid-cols-[auto_auto_auto] items-center">
                    <Select
                      value={form.heureFinHour}
                      onValueChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          heureFinHour: value,
                          heureFin: buildTime(value, prev.heureFinMinute),
                        }))
                      }
                    >
                      <SelectTrigger
                        id="heureFin"
                        className="h-11 min-w-[56px] justify-start gap-0.5 rounded-none border-0 bg-transparent px-1.5 pr-1 shadow-none focus:ring-0"
                      >
                        <SelectValue placeholder="Heure" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {HOUR_OPTIONS.map((hour) => (
                          <SelectItem key={hour} value={hour}>
                            {hour}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="px-0.5 text-sm text-muted-foreground">:</div>

                    <Select
                      value={form.heureFinMinute}
                      onValueChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          heureFinMinute: value,
                          heureFin: buildTime(prev.heureFinHour, value),
                        }))
                      }
                    >
                      <SelectTrigger className="h-11 min-w-[56px] justify-start gap-0.5 rounded-none border-0 bg-transparent px-1.5 pr-1 shadow-none focus:ring-0">
                        <SelectValue placeholder="Minute" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {MINUTE_OPTIONS.map((minute) => (
                          <SelectItem key={minute} value={minute}>
                            {minute}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Traitement..." : isEditing ? "Modifier" : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet horaire ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est definitive. Si cet horaire est deja affecte a des
              agents, la suppression sera refusee.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </>
      )}
    </div>
  );
}
