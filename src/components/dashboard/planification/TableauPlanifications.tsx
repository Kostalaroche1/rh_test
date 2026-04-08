"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  IconDotsVertical,
  IconPencil,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";

import {
  CreatePlanification,
  DeletePlanification,
  GetPlanifications,
  type PlanificationParticipantItem,
  GetTypesPlanification,
  type PlanificationItem,
  type TypePlanificationItem,
  UpdatePlanification,
} from "@/app/action/planification/action";
import { GetAgent } from "@/app/action/agent/getAgent/action";
import { GetUnitesOrganisationnelles, type UniteOrganisationnelleItem } from "@/app/action/organisation-dynamique/action";
import { GetAffectations, type Affectation } from "@/app/action/affectations/action";
import { GetAllDemandeConge } from "@/app/action/conge/demandeconge/action";
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

type AgentLookup = {
  id: number;
  nom?: string;
  prenom?: string;
  matricule?: string;
};

type DemandeCongeLookup = {
  id: number;
  statut?: string;
  agent?: {
    nom?: string;
    prenom?: string;
    matricule?: string;
  };
  typeConge?: {
    libelle?: string;
  };
};

type FormState = {
  id?: number;
  titre: string;
  description: string;
  typePlanificationId: string;
  dateDebut: string;
  dateFin: string;
  statut: PlanificationItem["statut"];
  priorite: PlanificationItem["priorite"];
  uniteOrganisationnelleId: string;
  demandeCongeId: string;
  affectationId: string;
  notes: string;
  participantAgentIds: string[];
};

const emptyForm: FormState = {
  titre: "",
  description: "",
  typePlanificationId: "",
  dateDebut: "",
  dateFin: "",
  statut: "BROUILLON",
  priorite: "NORMALE",
  uniteOrganisationnelleId: "",
  demandeCongeId: "",
  affectationId: "",
  notes: "",
  participantAgentIds: [],
};

const PLAN_STATUSES: Array<{ value: PlanificationItem["statut"]; label: string }> = [
  { value: "BROUILLON", label: "Brouillon" },
  { value: "PLANIFIE", label: "Planifie" },
  { value: "EN_COURS", label: "En cours" },
  { value: "TERMINE", label: "Termine" },
  { value: "ANNULE", label: "Annule" },
  { value: "REPORTE", label: "Reporte" },
];

const PLAN_PRIORITIES: Array<{ value: PlanificationItem["priorite"]; label: string }> = [
  { value: "FAIBLE", label: "Faible" },
  { value: "NORMALE", label: "Normale" },
  { value: "ELEVEE", label: "Elevee" },
  { value: "CRITIQUE", label: "Critique" },
];

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

function formatDateInput(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function getTodayInput() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDemandes(raw: any): DemandeCongeLookup[] {
  if (Array.isArray(raw?.getData)) {
    return raw.getData;
  }

  if (Array.isArray(raw?.data)) {
    return raw.data;
  }

  if (Array.isArray(raw)) {
    return raw;
  }

  return [];
}

function getStatusBadgeVariant(status: PlanificationItem["statut"]) {
  switch (status) {
    case "TERMINE":
      return "default";
    case "ANNULE":
      return "destructive";
    case "EN_COURS":
      return "secondary";
    default:
      return "outline";
  }
}

function getPriorityBadgeVariant(priority: PlanificationItem["priorite"]) {
  switch (priority) {
    case "CRITIQUE":
      return "destructive";
    case "ELEVEE":
      return "secondary";
    default:
      return "outline";
  }
}

export default function TableauPlanifications() {
  const { auth }: any = useAuth();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PlanificationItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const { data: planificationsRaw, isPending } = useGet<PlanificationItem[]>(
    ["planifications"],
    GetPlanifications
  );
  const { data: typesRaw = [] } = useGet<TypePlanificationItem[]>(
    ["types-planification"],
    GetTypesPlanification
  );
  const { data: agentsRaw = [] } = useGet<AgentLookup[]>(
    ["agents-planification"],
    GetAgent
  );
  const { data: unitesRaw = [] } = useGet<UniteOrganisationnelleItem[]>(
    ["organisation-unites-planification"],
    GetUnitesOrganisationnelles
  );
  const { data: affectationsRaw = [] } = useGet<Affectation[]>(
    ["affectations-planification"],
    GetAffectations
  );
  const { data: demandesRaw = [] } = useGet<any>(
    ["demandes-conge-planification"],
    GetAllDemandeConge
  );

  const planifications = Array.isArray(planificationsRaw) ? planificationsRaw : [];
  const types = Array.isArray(typesRaw) ? typesRaw : [];
  const agents = Array.isArray(agentsRaw) ? agentsRaw : [];
  const unites = Array.isArray(unitesRaw) ? unitesRaw : [];
  const affectations = Array.isArray(affectationsRaw) ? affectationsRaw : [];
  const demandes = normalizeDemandes(demandesRaw);

  const { mutateAsync: createPlanification, isPending: creating } = usePost(
    CreatePlanification,
    ["planifications"]
  );
  const { mutateAsync: updatePlanification, isPending: updating } = usePut(
    UpdatePlanification,
    ["planifications"]
  );
  const { mutateAsync: deletePlanification, isPending: deleting } = useDelete(
    DeletePlanification,
    ["planifications"]
  );

  const canRead = hasAnyPermission(auth, [
    "planification.read",
    "planification.create",
    "planification.update",
    "planification.delete",
    "planification.assign",
    "planification.validate",
  ]);
  const canManage = hasAnyPermission(auth, [
    "planification.create",
    "planification.update",
    "planification.delete",
    "planification.assign",
    "planification.validate",
  ]);

  const filteredPlanifications = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return planifications;
    }

    return planifications.filter((item: any) => {
      const participants = Array.isArray(item.participants)
        ? item.participants
            .map((participant: any) =>
              `${participant.agent?.matricule ?? ""} ${participant.agent?.nom ?? ""} ${participant.agent?.prenom ?? ""}`
            )
            .join(" ")
        : "";

      return `${item.titre} ${item.typePlanification?.nom ?? ""} ${item.uniteOrganisationnelle?.nom ?? ""} ${item.statut} ${item.priorite} ${participants}`
        .toLowerCase()
        .includes(query);
    });
  }, [planifications, search]);

  const selectedParticipants = useMemo(
    () => new Set(form.participantAgentIds),
    [form.participantAgentIds]
  );

  const submitting = creating || updating;
  const isEditing = Boolean(form.id);

  function resetForm() {
    setForm(emptyForm);
  }

  function openCreate() {
    resetForm();
    setDialogOpen(true);
  }

  function openEdit(item: any) {
    setForm({
      id: item.id,
      titre: item.titre ?? "",
      description: item.description ?? "",
      typePlanificationId: item.typePlanificationId ? String(item.typePlanificationId) : "",
      dateDebut: formatDateInput(item.dateDebut),
      dateFin: formatDateInput(item.dateFin),
      statut: item.statut ?? "BROUILLON",
      priorite: item.priorite ?? "NORMALE",
      uniteOrganisationnelleId: item.uniteOrganisationnelleId ? String(item.uniteOrganisationnelleId) : "",
      demandeCongeId: item.demandeCongeId ? String(item.demandeCongeId) : "",
      affectationId: item.affectationId ? String(item.affectationId) : "",
      notes: item.notes ?? "",
      participantAgentIds: Array.isArray(item.participants)
        ? item.participants.map((participant: any) => String(participant.agentId))
        : [],
    });
    setDialogOpen(true);
  }

  function toggleParticipant(agentId: string, checked: boolean) {
    setForm((current) => {
      if (checked) {
        return {
          ...current,
          participantAgentIds: [...current.participantAgentIds, agentId],
        };
      }

      return {
        ...current,
        participantAgentIds: current.participantAgentIds.filter((value) => value !== agentId),
      };
    });
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.titre.trim() || !form.typePlanificationId || !form.dateDebut) {
      toast.error("Le titre, le type et la date de debut sont obligatoires.");
      return;
    }

    if (form.dateFin && form.dateFin < form.dateDebut) {
      toast.error("La date de fin doit etre superieure ou egale a la date de debut.");
      return;
    }

    const participants: PlanificationParticipantItem[] = form.participantAgentIds.map((agentId) => ({
      agentId: Number(agentId),
      roleDansPlan: "BENEFICIAIRE",
      obligatoire: true,
    }));

    const payload: Partial<PlanificationItem> = {
      titre: form.titre.trim(),
      description: form.description.trim() || null,
      typePlanificationId: Number(form.typePlanificationId),
      dateDebut: form.dateDebut,
      dateFin: form.dateFin || null,
      statut: form.statut,
      priorite: form.priorite,
      uniteOrganisationnelleId: form.uniteOrganisationnelleId ? Number(form.uniteOrganisationnelleId) : null,
      demandeCongeId: form.demandeCongeId ? Number(form.demandeCongeId) : null,
      affectationId: form.affectationId ? Number(form.affectationId) : null,
      notes: form.notes.trim() || null,
      participants,
      rappels: [],
    };

    try {
      if (isEditing && form.id) {
        const result: any = await updatePlanification({ ...payload, id: form.id });
        if (result?.message && result?.data == null) {
          throw new Error(result.message);
        }
        toast.success("Planification modifiee.");
      } else {
        const result: any = await createPlanification(payload);
        if (result?.message && result?.data == null) {
          throw new Error(result.message);
        }
        toast.success("Planification creee.");
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
      const result: any = await deletePlanification({ id: deleteTarget.id });
      if (result?.message && result?.success !== true) {
        throw new Error(result.message);
      }
      toast.success("Planification supprimee.");
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error(error?.message ?? "Suppression impossible.");
    }
  }

  if (!canRead) {
    return (
      <div className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        Aucun acces sur les planifications.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher une planification..."
          className="w-full md:max-w-sm"
        />

        {canManage && (
          <Button type="button" onClick={openCreate} disabled={types.length === 0}>
            <IconPlus className="mr-2 h-4 w-4" />
            Nouvelle planification
          </Button>
        )}
      </div>

      {types.length === 0 && (
        <div className="rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground">
          Aucun type de planification disponible. Creez d'abord au moins un type pour demarrer.
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Titre</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Periode</TableHead>
            <TableHead>Unite</TableHead>
            <TableHead>Participants</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Priorite</TableHead>
            {canManage && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {!isPending &&
            filteredPlanifications.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col gap-1">
                    <span>{item.titre}</span>
                    {item.notes && (
                      <span className="text-xs text-muted-foreground">{item.notes}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{item.typePlanification?.nom ?? "--"}</TableCell>
                <TableCell>
                  {formatDate(item.dateDebut)} - {formatDate(item.dateFin)}
                </TableCell>
                <TableCell>{item.uniteOrganisationnelle?.nom ?? "--"}</TableCell>
                <TableCell>
                  {Array.isArray(item.participants) && item.participants.length > 0
                    ? item.participants
                        .slice(0, 2)
                        .map((participant: any) => participant.agent?.matricule || participant.agent?.nom)
                        .filter(Boolean)
                        .join(", ")
                    : "--"}
                  {Array.isArray(item.participants) && item.participants.length > 2
                    ? ` +${item.participants.length - 2}`
                    : ""}
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(item.statut)}>{item.statut}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getPriorityBadgeVariant(item.priorite)}>{item.priorite}</Badge>
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

          {!isPending && filteredPlanifications.length === 0 && (
            <TableRow>
              <TableCell colSpan={canManage ? 8 : 7} className="text-center text-muted-foreground">
                Aucune planification trouvee.
              </TableCell>
            </TableRow>
          )}

          {isPending && (
            <TableRow>
              <TableCell colSpan={canManage ? 8 : 7} className="text-center text-muted-foreground">
                Chargement...
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Modifier une planification" : "Creer une planification"}
            </DialogTitle>
            <DialogDescription>
              Cette premiere version couvre le coeur du besoin RH: type, periode, participants et liens metier.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={submitForm}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="titre-planification">Titre</Label>
                <Input
                  id="titre-planification"
                  value={form.titre}
                  onChange={(event) => setForm((current) => ({ ...current, titre: event.target.value }))}
                  placeholder="Ex: Conge de l'equipe Finance"
                />
              </div>

              <div className="space-y-2">
                <Label>Type de planification</Label>
                <Select
                  value={form.typePlanificationId}
                  onValueChange={(value) => setForm((current) => ({ ...current, typePlanificationId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((type) => (
                      <SelectItem key={type.id} value={String(type.id)}>
                        {type.nom} ({type.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description-planification">Description</Label>
              <Textarea
                id="description-planification"
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Contexte et objectif de la planification."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date-debut-planification">Date de debut</Label>
                <Input
                  id="date-debut-planification"
                  type="date"
                  min={getTodayInput()}
                  value={form.dateDebut}
                  onChange={(event) => setForm((current) => ({ ...current, dateDebut: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-fin-planification">Date de fin</Label>
                <Input
                  id="date-fin-planification"
                  type="date"
                  min={form.dateDebut || getTodayInput()}
                  value={form.dateFin}
                  onChange={(event) => setForm((current) => ({ ...current, dateFin: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select
                  value={form.statut}
                  onValueChange={(value: PlanificationItem["statut"]) =>
                    setForm((current) => ({ ...current, statut: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAN_STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priorite</Label>
                <Select
                  value={form.priorite}
                  onValueChange={(value: PlanificationItem["priorite"]) =>
                    setForm((current) => ({ ...current, priorite: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAN_PRIORITIES.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Unite organisationnelle</Label>
                <Select
                  value={form.uniteOrganisationnelleId || "__none__"}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      uniteOrganisationnelleId: value === "__none__" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optionnel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Aucune</SelectItem>
                    {unites.map((unite) => (
                      <SelectItem key={unite.id} value={String(unite.id)}>
                        {unite.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Demande de conge liee</Label>
                <Select
                  value={form.demandeCongeId || "__none__"}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      demandeCongeId: value === "__none__" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optionnel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Aucune</SelectItem>
                    {demandes.map((demande) => (
                      <SelectItem key={demande.id} value={String(demande.id)}>
                        #{demande.id} - {demande.typeConge?.libelle ?? "Conge"} -{" "}
                        {demande.agent?.matricule || demande.agent?.nom || "Agent"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Affectation liee</Label>
                <Select
                  value={form.affectationId || "__none__"}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      affectationId: value === "__none__" ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Optionnel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Aucune</SelectItem>
                    {affectations.map((affectation) => (
                      <SelectItem key={affectation.id} value={String(affectation.id)}>
                        #{affectation.id} - agent {affectation.agentId}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes-planification">Notes</Label>
              <Textarea
                id="notes-planification"
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Observations de suivi, dependances, contraintes..."
              />
            </div>

            <div className="space-y-2">
              <Label>Participants</Label>
              <div className="max-h-52 overflow-y-auto rounded-md border p-3">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {agents.map((agent) => {
                    const agentId = String(agent.id);
                    return (
                      <label
                        key={agent.id}
                        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={selectedParticipants.has(agentId)}
                          onChange={(event) => toggleParticipant(agentId, event.target.checked)}
                        />
                        <span>
                          {agent.matricule ? `${agent.matricule} - ` : ""}
                          {agent.nom} {agent.prenom}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
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
            <AlertDialogTitle>Supprimer cette planification ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est definitive. Les participants et rappels lies seront egalement supprimes.
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
