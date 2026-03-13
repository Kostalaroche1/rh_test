"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";

import {
  AddHoraireAgent,
  DeleteHoraireAgent,
  GetHoraireAgent,
  UpdateHoraireAgent,
} from "@/app/action/horaireAgent/action";
import { useDelete, useGet, usePost, usePut } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useAuth } from "@/app/contexts/auth/context";
import { hasAnyPermission } from "@/security/permissions";

type LookupAgent = {
  id: number;
  nom: string;
  prenom: string;
  matricule: string;
};

type LookupHoraire = {
  id: number;
  nomHoraire: string;
  heureDebut: string;
  heureFin: string;
};

type HoraireAgentItem = {
  id: number;
  dateDebut: string;
  dateFin?: string | null;
  lundi: boolean;
  mardi: boolean;
  mercredi: boolean;
  jeudi: boolean;
  vendredi: boolean;
  samedi: boolean;
  dimanche: boolean;
  agent: LookupAgent;
  horaire: LookupHoraire;
  creerPar?: { login?: string };
};

type HoraireAgentResponse = {
  data: HoraireAgentItem[];
  lookups: {
    agents: LookupAgent[];
    horaires: LookupHoraire[];
  };
};

type FormState = {
  id?: number;
  agentId: string;
  horaireId: string;
  dateDebut: string;
  dateFin: string;
  lundi: boolean;
  mardi: boolean;
  mercredi: boolean;
  jeudi: boolean;
  vendredi: boolean;
  samedi: boolean;
  dimanche: boolean;
};

const defaultForm: FormState = {
  agentId: "",
  horaireId: "",
  dateDebut: "",
  dateFin: "",
  lundi: false,
  mardi: false,
  mercredi: false,
  jeudi: false,
  vendredi: false,
  samedi: false,
  dimanche: false,
};

function getTodayInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, "0");
  const day = `${today.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value?: string | null) {
  if (!value) {
    return "--";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }
  return date.toLocaleDateString("fr-FR");
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

function formatDateInput(value?: string | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().split("T")[0];
}

const jours = [
  { key: "lundi", label: "Lun" },
  { key: "mardi", label: "Mar" },
  { key: "mercredi", label: "Mer" },
  { key: "jeudi", label: "Jeu" },
  { key: "vendredi", label: "Ven" },
  { key: "samedi", label: "Sam" },
  { key: "dimanche", label: "Dim" },
] as const;

export default function TableHoraireAgent() {
  const { auth }: any = useAuth();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HoraireAgentItem | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const { data, isPending } = useGet<HoraireAgentResponse>(
    ["HoraireAgentAll"],
    GetHoraireAgent
  );

  const rows = Array.isArray(data?.data) ? data.data : [];
  const agents = Array.isArray(data?.lookups?.agents) ? data.lookups.agents : [];
  const horaires = Array.isArray(data?.lookups?.horaires) ? data.lookups.horaires : [];

  const { mutateAsync: createHoraireAgent, isPending: creating } = usePost(
    AddHoraireAgent,
    ["HoraireAgentAll"]
  );
  const { mutateAsync: updateHoraireAgent, isPending: updating } = usePut(
    UpdateHoraireAgent,
    ["HoraireAgentAll"]
  );
  const { mutateAsync: deleteHoraireAgent, isPending: deleting } = useDelete(
    DeleteHoraireAgent,
    ["HoraireAgentAll"]
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const agent = `${row.agent?.matricule ?? ""} ${row.agent?.nom ?? ""} ${row.agent?.prenom ?? ""}`.toLowerCase();
      const horaire = `${row.horaire?.nomHoraire ?? ""} ${formatTime(row.horaire?.heureDebut ?? "")}-${formatTime(row.horaire?.heureFin ?? "")}`.toLowerCase();
      return agent.includes(q) || horaire.includes(q);
    });
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  const canReadHoraireAgent = hasAnyPermission(auth, [
    "horaire_agent.read",
    "horaire_agent.create",
    "horaire_agent.update",
    "horaire_agent.delete",
  ]);
  const canManageHoraireAgent = hasAnyPermission(auth, [
    "horaire_agent.create",
    "horaire_agent.update",
    "horaire_agent.delete",
  ]);

  const isEditing = Boolean(form.id);
  const submitting = creating || updating;
  const todayInputValue = getTodayInputValue();

  function resetForm() {
    setForm(defaultForm);
  }

  function handlePageSizeChange(value: string) {
    setPageSize(Number(value));
    setPage(1);
  }

  function openCreate() {
    resetForm();
    setDialogOpen(true);
  }

  function openEdit(item: HoraireAgentItem) {
    setForm({
      id: item.id,
      agentId: String(item.agent?.id ?? ""),
      horaireId: String(item.horaire?.id ?? ""),
      dateDebut: formatDateInput(item.dateDebut),
      dateFin: formatDateInput(item.dateFin),
      lundi: Boolean(item.lundi),
      mardi: Boolean(item.mardi),
      mercredi: Boolean(item.mercredi),
      jeudi: Boolean(item.jeudi),
      vendredi: Boolean(item.vendredi),
      samedi: Boolean(item.samedi),
      dimanche: Boolean(item.dimanche),
    });
    setDialogOpen(true);
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.agentId || !form.horaireId || !form.dateDebut) {
      toast.error("Agent, horaire et date debut sont obligatoires");
      return;
    }

    if (form.dateDebut < todayInputValue) {
      toast.error("La date debut ne peut pas etre dans le passe");
      return;
    }

    if (form.dateFin && form.dateFin < todayInputValue) {
      toast.error("La date fin ne peut pas etre dans le passe");
      return;
    }

    if (form.dateFin && form.dateFin < form.dateDebut) {
      toast.error("La date fin doit etre superieure ou egale a la date debut");
      return;
    }

    const hasAnyDay =
      form.lundi ||
      form.mardi ||
      form.mercredi ||
      form.jeudi ||
      form.vendredi ||
      form.samedi ||
      form.dimanche;

    if (!hasAnyDay) {
      toast.error("Selectionnez au moins un jour de travail");
      return;
    }

    try {
      const payload = {
        id: form.id,
        agentId: Number(form.agentId),
        horaireId: Number(form.horaireId),
        dateDebut: form.dateDebut,
        dateFin: form.dateFin || undefined,
        lundi: form.lundi,
        mardi: form.mardi,
        mercredi: form.mercredi,
        jeudi: form.jeudi,
        vendredi: form.vendredi,
        samedi: form.samedi,
        dimanche: form.dimanche,
      };

      if (isEditing && form.id) {
        await updateHoraireAgent(payload);
        toast.success("Horaire agent modifie avec succes");
      } else {
        await createHoraireAgent(payload);
        toast.success("Horaire agent cree avec succes");
      }

      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error?.message ?? "Operation impossible");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }
    try {
      await deleteHoraireAgent({ id: deleteTarget.id });
      toast.success("Horaire agent supprime avec succes");
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error(error?.message ?? "Suppression impossible");
    }
  }

  return (
    <CardWrap>
      {!canReadHoraireAgent && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Aucun acces en lecture sur les horaires agents.
        </div>
      )}
      {canReadHoraireAgent && (
      <>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher agent ou horaire..."
          className="w-full md:max-w-sm"
        />
        {canManageHoraireAgent && (
          <Button type="button" onClick={openCreate}>
            <IconPlus className="mr-2 h-4 w-4" />
            Ajouter Horaire Agent
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agent</TableHead>
            <TableHead>Horaire</TableHead>
            <TableHead>Periode</TableHead>
            <TableHead>Jours</TableHead>
            <TableHead>Cree par</TableHead>
            {canManageHoraireAgent && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {!isPending &&
            paginatedRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  {row.agent?.matricule} - {row.agent?.nom} {row.agent?.prenom}
                </TableCell>
                <TableCell>
                  {row.horaire?.nomHoraire} ({formatTime(row.horaire?.heureDebut)} - {formatTime(row.horaire?.heureFin)})
                </TableCell>
                <TableCell>
                  {formatDate(row.dateDebut)} - {formatDate(row.dateFin)}
                </TableCell>
                <TableCell>
                  {jours
                    .filter((day) => Boolean(row[day.key]))
                    .map((day) => day.label)
                    .join(", ") || "--"}
                </TableCell>
                <TableCell>{row.creerPar?.login ?? "--"}</TableCell>
                {canManageHoraireAgent && <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <IconDotsVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(row)}>
                        <IconPencil className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteTarget(row)}
                      >
                        <IconTrash className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>}
              </TableRow>
            ))}

          {!isPending && filteredRows.length === 0 && (
            <TableRow>
              <TableCell colSpan={canManageHoraireAgent ? 6 : 5} className="text-center text-muted-foreground">
                Aucun horaire agent trouve
              </TableCell>
            </TableRow>
          )}

          {isPending && (
            <TableRow>
              <TableCell colSpan={canManageHoraireAgent ? 6 : 5} className="text-center text-muted-foreground">
                Chargement...
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {!isPending && filteredRows.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 border-t pt-3 md:flex-row md:items-center md:justify-between">
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
          if (!open) resetForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Modifier Horaire Agent" : "Ajouter Horaire Agent"}</DialogTitle>
            <DialogDescription>
              Selectionnez un agent, un horaire, la periode et les jours appliques.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={submitForm}>
            <div className="space-y-2">
              <Label>Agent</Label>
              <Select value={form.agentId} onValueChange={(value) => setForm((prev) => ({ ...prev, agentId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un agent" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={String(agent.id)}>
                      {agent.matricule} - {agent.nom} {agent.prenom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Horaire de travail</Label>
              <Select value={form.horaireId} onValueChange={(value) => setForm((prev) => ({ ...prev, horaireId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un horaire" />
                </SelectTrigger>
                <SelectContent>
                  {horaires.map((horaire) => (
                    <SelectItem key={horaire.id} value={String(horaire.id)}>
                      {horaire.nomHoraire} ({formatTime(horaire.heureDebut)} - {formatTime(horaire.heureFin)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Date debut</Label>
                <Input
                  type="date"
                  min={todayInputValue}
                  value={form.dateDebut}
                  onChange={(e) =>
                    setForm((prev) => {
                      const nextDateDebut = e.target.value;
                      const nextDateFin =
                        prev.dateFin && prev.dateFin < nextDateDebut ? nextDateDebut : prev.dateFin;

                      return {
                        ...prev,
                        dateDebut: nextDateDebut,
                        dateFin: nextDateFin,
                      };
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Date fin (optionnel)</Label>
                <Input
                  type="date"
                  min={form.dateDebut || todayInputValue}
                  value={form.dateFin}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, dateFin: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Jours de travail</Label>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {jours.map((day) => (
                  <label key={day.key} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={Boolean(form[day.key])}
                      onCheckedChange={(checked) =>
                        setForm((prev) => ({ ...prev, [day.key]: checked === true }))
                      }
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Traitement..." : isEditing ? "Modifier" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cet horaire agent ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est definitive.
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
      </>
      )}
    </CardWrap>
  );
}

function CardWrap({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border bg-card p-4">{children}</div>;
}
