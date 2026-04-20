"use client";

import { useEffect, useMemo, useState } from "react";
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDeviceFloppy,
  IconEdit,
  IconLinkPlus,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { BootstrapPermissions } from "@/app/action/permission/bootstrap/action";
import { GetPermissions } from "@/app/action/permission/action";
import { AddRole, DeleteRole, UpdateRole } from "@/app/action/role/action";
import {
  GetRolePermissions,
  UpdateRolePermissions,
} from "@/app/action/rolePermission/action";
import { useDelete, useGet, usePost, usePut } from "@/hooks/useApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { canonicalizePermissionCode } from "@/security/permission-aliases";

type PermissionItem = {
  id: number;
  code: string;
  _count?: {
    rolePermission?: number;
  };
};

type RolePermissionItem = {
  id: number;
  nom: string;
  key?: string | null;
  description?: string | null;
  actif: boolean;
  _count?: {
    utilisateurs?: number;
    rolePermission?: number;
  };
  rolePermission: Array<{
    permissionId: number;
  }>;
  reglesPortee: Array<{
    permissionId: number;
    portee: ScopeValue;
  }>;
};

type ScopeValue =
  | "SOI_MEME"
  | "UNITE"
  | "UNITE_ET_DESCENDANTS"
  | "PROVINCE"
  | "TOUTE_ORGANISATION";

type RolePermissionResponse = {
  status: number;
  data?: {
    roles: RolePermissionItem[];
    permissions: Array<{
      id: number;
      code: string;
      libelle?: string | null;
      module?: string | null;
    }>;
  };
  message?: string;
};

type PermissionMenuEntry = {
  id: number;
  code: string;
};

type PermissionMenuItem = {
  itemKey: string;
  itemLabel: string;
  permissions: PermissionMenuEntry[];
};

type PermissionMenuModule = {
  moduleKey: string;
  moduleLabel: string;
  items: PermissionMenuItem[];
};

type PermissionModalState = {
  roleId: number;
  roleName: string;
  moduleKey: string;
  moduleLabel: string;
  itemKey: string;
  itemLabel: string;
  permissionIds: number[];
} | null;

const defaultRoleForm = {
  nom: "",
  description: "",
};

const EMPTY_PERMISSION_ITEMS: PermissionItem[] = [];
const EMPTY_ROLE_ITEMS: RolePermissionItem[] = [];
const EMPTY_ASSIGNABLE_PERMISSIONS: NonNullable<RolePermissionResponse["data"]>["permissions"] =
  [];

const RESOURCE_LABELS: Record<string, string> = {
  role: "Role",
  permission: "Permission",
  user: "Utilisateur",
  agent: "Employe",
  agent_dossier: "Dossier agent",
  presence: "Presence",
  demande_conge: "Demande de conge",
  type_conge: "Type de conge",
  paie: "Paie",
  horaire_travail: "Horaire de travail",
  horaire_agent: "Horaire employe",
  type_planification: "Type de planification",
  planification: "Planification",
  affectation: "Affectation",
  type_unite_organisationnelle: "Type d'unite",
  unite_organisationnelle: "Unite organisationnelle",
  poste: "Poste",
  fonction: "Fonction",
  grade: "Grade",
  province: "Province",
  notification: "Notification",
  rapport: "Rapport",
  polyclinique: "Acces polyclinique",
  polyclinique_demande: "Demande de soin polyclinique",
  polyclinique_dossier: "Dossier medical polyclinique",
};

const ACTION_LABELS: Record<string, string> = {
  read: "Lire",
  create: "Creer",
  update: "Modifier",
  delete: "Supprimer",
  sign: "Signer",
  biometric: "Biometrie",
  confirm: "Confirmer",
  validate: "Valider",
  request: "Demander",
  publish: "Publier",
  assign: "Attribuer",
};

const MODULE_LABELS: Record<string, string> = {
  access: "Acces et autorisations",
  employes: "Employes",
  presence: "Presence",
  conges: "Conges",
  paie: "Paie",
  horaires: "Horaires",
  planification: "Planification",
  organisation: "Organisation",
  communication: "Notifications & Rapports",
  polyclinique: "Polyclinique",
  autres: "Autres",
};

const SCOPE_LABELS: Record<ScopeValue, string> = {
  SOI_MEME: "Moi-meme",
  UNITE: "Mon unite",
  UNITE_ET_DESCENDANTS: "Mon unite et sous-unites",
  PROVINCE: "Ma province",
  TOUTE_ORGANISATION: "Toute l'organisation",
};

const SCOPE_HELPERS: Array<{
  value: ScopeValue;
  title: string;
  description: string;
}> = [
  {
    value: "SOI_MEME",
    title: "Moi-meme",
    description: "La personne agit uniquement sur ses propres donnees.",
  },
  {
    value: "UNITE",
    title: "Mon unite",
    description: "La personne agit sur son unite organisationnelle directe.",
  },
  {
    value: "UNITE_ET_DESCENDANTS",
    title: "Mon unite et sous-unites",
    description: "La personne agit sur son unite et sur toutes les sous-unites rattachees.",
  },
  {
    value: "PROVINCE",
    title: "Ma province",
    description: "La personne agit sur toutes les unites rattachees a sa province.",
  },
  {
    value: "TOUTE_ORGANISATION",
    title: "Toute l'organisation",
    description: "La personne agit sur l'ensemble de l'entreprise.",
  },
];

const HIDDEN_WORKFLOW_PERMISSIONS = new Set([
  "presence.create",
  "demande_conge.create",
]);

const RESOURCE_MODULES: Record<string, string> = {
  role: "access",
  permission: "access",
  user: "employes",
  agent: "employes",
  agent_dossier: "employes",
  presence: "presence",
  demande_conge: "conges",
  type_conge: "conges",
  paie: "paie",
  horaire_travail: "horaires",
  horaire_agent: "horaires",
  type_planification: "planification",
  planification: "planification",
  affectation: "organisation",
  type_unite_organisationnelle: "organisation",
  unite_organisationnelle: "organisation",
  poste: "organisation",
  fonction: "organisation",
  grade: "organisation",
  province: "organisation",
  notification: "communication",
  rapport: "communication",
  polyclinique: "polyclinique",
  polyclinique_demande: "polyclinique",
  polyclinique_dossier: "polyclinique",
};

function formatPermissionLabel(code: string) {
  // Keep the business wording readable for admins while preserving the underlying code for support/debugging.
  const normalized = canonicalizePermissionCode(code);
  const parts = normalized.split(".");

  if (parts.length < 2) {
    return {
      title: normalized || "--",
      subtitle: "Permission",
    };
  }

  const resource = parts.slice(0, -1).join(".");
  const action = parts.at(-1) ?? "";

  return {
    title: ACTION_LABELS[action] ?? action,
    subtitle: RESOURCE_LABELS[resource] ?? resource.replace(/_/g, " "),
    moduleKey: (RESOURCE_MODULES[resource] ?? "autres") as string,
    moduleLabel: (MODULE_LABELS[RESOURCE_MODULES[resource] ?? "autres"] ?? "Autres") as string,
  };
}

export default function GestionnairePermissions() {
  const [roleSelections, setRoleSelections] = useState<Record<number, number[]>>({});
  const [roleScopes, setRoleScopes] = useState<Record<number, Record<number, ScopeValue>>>({});
  const [roleForm, setRoleForm] = useState(defaultRoleForm);
  const [editRole, setEditRole] = useState<RolePermissionItem | null>(null);
  const [editForm, setEditForm] = useState(defaultRoleForm);
  const [deleteRole, setDeleteRole] = useState<RolePermissionItem | null>(null);
  const [permissionSearch, setPermissionSearch] = useState("");
  const [roleSearch, setRoleSearch] = useState("");
  const [permissionPage, setPermissionPage] = useState(1);
  const [permissionPageSize, setPermissionPageSize] = useState(5);
  const [roleListPage, setRoleListPage] = useState(1);
  const [roleListPageSize, setRoleListPageSize] = useState(5);
  const [selectedRoleView, setSelectedRoleView] = useState("all");
  const [expandedModulesByRole, setExpandedModulesByRole] = useState<
    Record<number, Record<string, boolean>>
  >({});
  const [permissionModal, setPermissionModal] = useState<PermissionModalState>(null);

  const { data: permissionsResponse, refetch: refetchPermissions } = useGet<{ status: number; data?: PermissionItem[]; message?: string }>(
    ["PermissionList"],
    GetPermissions
  );
  const { data: rolePermissionResponse, refetch: refetchRolePermissions } = useGet<RolePermissionResponse>(
    ["RoleMatricePermissions"],
    GetRolePermissions
  );

  const permissions = Array.isArray(permissionsResponse?.data)
    ? permissionsResponse.data.filter(
        (permission) => !HIDDEN_WORKFLOW_PERMISSIONS.has(canonicalizePermissionCode(permission.code))
      )
    : EMPTY_PERMISSION_ITEMS;
  const roles = Array.isArray(rolePermissionResponse?.data?.roles)
    ? rolePermissionResponse.data.roles
    : EMPTY_ROLE_ITEMS;
  const assignablePermissions = Array.isArray(rolePermissionResponse?.data?.permissions)
    ? rolePermissionResponse.data.permissions.filter(
        (permission) => !HIDDEN_WORKFLOW_PERMISSIONS.has(canonicalizePermissionCode(permission.code))
      )
    : EMPTY_ASSIGNABLE_PERMISSIONS;

  useEffect(() => {
    const nextSelections: Record<number, number[]> = {};
    const nextScopes: Record<number, Record<number, ScopeValue>> = {};

    for (const role of roles) {
      nextSelections[role.id] = role.rolePermission.map((item) => item.permissionId);
      nextScopes[role.id] = Object.fromEntries(
        role.reglesPortee.map((item) => [item.permissionId, item.portee])
      ) as Record<number, ScopeValue>;
    }

    setRoleSelections(nextSelections);
    setRoleScopes(nextScopes);
  }, [roles]);

  const { mutateAsync: createRole, isPending: creatingRole } = usePost(
    AddRole,
    ["RoleMatricePermissions"]
  );
  const { mutateAsync: updateRoleMeta, isPending: updatingRole } = usePut(
    UpdateRole,
    ["RoleMatricePermissions"]
  );
  const { mutateAsync: bootstrapPermissions, isPending: bootstrappingPermissions } = usePost(
    BootstrapPermissions,
    ["PermissionList"]
  );
  const { mutateAsync: updateRolePermissions, isPending: savingPermissions } = usePut(
    UpdateRolePermissions,
    ["RoleMatricePermissions"]
  );
  const { mutateAsync: removeRole, isPending: deletingRole } = useDelete(
    DeleteRole,
    ["RoleMatricePermissions"]
  );

  const permissionUsage = useMemo(() => {
    return new Map(permissions.map((permission) => [permission.id, permission._count?.rolePermission ?? 0]));
  }, [permissions]);

  const filteredPermissions = useMemo(() => {
    const query = permissionSearch.trim().toLowerCase();
    if (!query) {
      return permissions;
    }

    return permissions.filter((permission) => {
      const label = formatPermissionLabel(permission.code);
      return [
        permission.code,
        label.title,
        label.subtitle,
        label.moduleLabel,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [permissions, permissionSearch]);

  const filteredRoles = useMemo(() => {
    const query = roleSearch.trim().toLowerCase();
    if (!query) {
      return roles;
    }

    return roles.filter((role) =>
      [role.nom, role.key ?? "", role.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [roles, roleSearch]);

  const visibleRoles = useMemo(() => {
    if (selectedRoleView === "all") {
      return filteredRoles;
    }

    const roleId = Number(selectedRoleView);
    if (!Number.isFinite(roleId)) {
      return filteredRoles;
    }

    return filteredRoles.filter((role) => role.id === roleId);
  }, [filteredRoles, selectedRoleView]);

  useEffect(() => {
    setPermissionPage(1);
  }, [permissionSearch, permissionPageSize]);

  useEffect(() => {
    setRoleListPage(1);
  }, [roleSearch, roleListPageSize]);

  const paginatedPermissions = useMemo(() => {
    if (permissionPageSize === -1) {
      return filteredPermissions;
    }

    const start = (permissionPage - 1) * permissionPageSize;
    return filteredPermissions.slice(start, start + permissionPageSize);
  }, [filteredPermissions, permissionPage, permissionPageSize]);

  const paginatedRoleList = useMemo(() => {
    if (roleListPageSize === -1) {
      return filteredRoles;
    }

    const start = (roleListPage - 1) * roleListPageSize;
    return filteredRoles.slice(start, start + roleListPageSize);
  }, [filteredRoles, roleListPage, roleListPageSize]);

  const permissionTotalPages = useMemo(() => {
    if (permissionPageSize === -1) {
      return 1;
    }
    return Math.max(1, Math.ceil(filteredPermissions.length / permissionPageSize));
  }, [filteredPermissions.length, permissionPageSize]);

  const roleListTotalPages = useMemo(() => {
    if (roleListPageSize === -1) {
      return 1;
    }
    return Math.max(1, Math.ceil(filteredRoles.length / roleListPageSize));
  }, [filteredRoles.length, roleListPageSize]);

  const safePermissionPage = Math.min(permissionPage, permissionTotalPages);
  const safeRoleListPage = Math.min(roleListPage, roleListTotalPages);

  useEffect(() => {
    if (permissionPage > permissionTotalPages) {
      setPermissionPage(permissionTotalPages);
    }
  }, [permissionPage, permissionTotalPages]);

  useEffect(() => {
    if (roleListPage > roleListTotalPages) {
      setRoleListPage(roleListTotalPages);
    }
  }, [roleListPage, roleListTotalPages]);

  const groupedPermissionCatalog = useMemo(() => {
    const groups = new Map<string, PermissionItem[]>();

    for (const permission of paginatedPermissions) {
      const label = formatPermissionLabel(permission.code);
      const key = label.moduleKey ?? "autres";
      const current = groups.get(key) ?? [];
      current.push(permission);
      groups.set(key, current);
    }

    return [...groups.entries()].map(([moduleKey, items]) => ({
      moduleKey,
      moduleLabel: MODULE_LABELS[moduleKey] ?? moduleKey,
      items,
    }));
  }, [paginatedPermissions]);

  const permissionMenuModules = useMemo<PermissionMenuModule[]>(() => {
    const modules = new Map<
      string,
      {
        moduleKey: string;
        moduleLabel: string;
        itemMap: Map<string, PermissionMenuItem>;
      }
    >();

    for (const permission of assignablePermissions) {
      const label = formatPermissionLabel(permission.code);
      const moduleKey = label.moduleKey ?? "autres";
      const moduleLabel = label.moduleLabel ?? MODULE_LABELS[moduleKey] ?? moduleKey;
      const itemLabel = label.subtitle || "Autres actions";
      const itemKey = itemLabel.toLowerCase().replace(/[^a-z0-9]+/g, "_");

      if (!modules.has(moduleKey)) {
        modules.set(moduleKey, {
          moduleKey,
          moduleLabel,
          itemMap: new Map(),
        });
      }

      const module = modules.get(moduleKey)!;
      if (!module.itemMap.has(itemKey)) {
        module.itemMap.set(itemKey, {
          itemKey,
          itemLabel,
          permissions: [],
        });
      }

      module.itemMap.get(itemKey)!.permissions.push({
        id: permission.id,
        code: permission.code,
      });
    }

    return [...modules.values()]
      .map((module) => ({
        moduleKey: module.moduleKey,
        moduleLabel: module.moduleLabel,
        items: [...module.itemMap.values()].sort((left, right) =>
          left.itemLabel.localeCompare(right.itemLabel)
        ),
      }))
      .sort((left, right) => left.moduleLabel.localeCompare(right.moduleLabel));
  }, [assignablePermissions]);

  const assignablePermissionById = useMemo(() => {
    return new Map(assignablePermissions.map((permission) => [permission.id, permission]));
  }, [assignablePermissions]);

  const modalPermissionItems = useMemo(() => {
    if (!permissionModal) {
      return [];
    }

    return permissionModal.permissionIds
      .map((permissionId) => {
        const permission = assignablePermissionById.get(permissionId);
        if (!permission) return null;
        const label = formatPermissionLabel(permission.code);

        return {
          id: permission.id,
          code: permission.code,
          label,
        };
      })
      .filter(Boolean) as Array<{
      id: number;
      code: string;
      label: ReturnType<typeof formatPermissionLabel>;
    }>;
  }, [permissionModal, assignablePermissionById]);

  function togglePermission(roleId: number, permissionId: number, checked: boolean) {
    setRoleSelections((prev) => {
      const current = prev[roleId] ?? [];
      const next = checked
        ? [...new Set([...current, permissionId])]
        : current.filter((item) => item !== permissionId);

      return {
        ...prev,
        [roleId]: next,
      };
    });

    setRoleScopes((prev) => {
      const current = { ...(prev[roleId] ?? {}) };
      if (checked) {
        current[permissionId] = current[permissionId] ?? "TOUTE_ORGANISATION";
      } else {
        delete current[permissionId];
      }

      return {
        ...prev,
        [roleId]: current,
      };
    });
  }

  function setModulePermissions(
    roleId: number,
    permissionIds: number[],
    checked: boolean
  ) {
    setRoleSelections((prev) => {
      const current = prev[roleId] ?? [];
      const next = checked
        ? [...new Set([...current, ...permissionIds])]
        : current.filter((item) => !permissionIds.includes(item));

      return {
        ...prev,
        [roleId]: next,
      };
    });

    setRoleScopes((prev) => {
      const current = { ...(prev[roleId] ?? {}) };

      if (checked) {
        for (const permissionId of permissionIds) {
          current[permissionId] = current[permissionId] ?? "TOUTE_ORGANISATION";
        }
      } else {
        for (const permissionId of permissionIds) {
          delete current[permissionId];
        }
      }

      return {
        ...prev,
        [roleId]: current,
      };
    });
  }

  function setPermissionScope(roleId: number, permissionId: number, value: ScopeValue) {
    setRoleScopes((prev) => ({
      ...prev,
      [roleId]: {
        ...(prev[roleId] ?? {}),
        [permissionId]: value,
      },
    }));
  }

  function toggleModuleSection(roleId: number, moduleKey: string) {
    setExpandedModulesByRole((prev) => ({
      ...prev,
      [roleId]: {
        ...(prev[roleId] ?? {}),
        [moduleKey]: !(prev[roleId]?.[moduleKey] ?? false),
      },
    }));
  }

  function openPermissionModalForItem(
    role: RolePermissionItem,
    module: PermissionMenuModule,
    item: PermissionMenuItem
  ) {
    setPermissionModal({
      roleId: role.id,
      roleName: role.nom,
      moduleKey: module.moduleKey,
      moduleLabel: module.moduleLabel,
      itemKey: item.itemKey,
      itemLabel: item.itemLabel,
      permissionIds: item.permissions.map((permission) => permission.id),
    });
  }

  function closePermissionModal() {
    setPermissionModal(null);
  }

  async function handleCreateRole() {
    const nom = roleForm.nom.trim();
    const description = roleForm.description.trim();

    if (!nom) {
      toast.error("Le nom du role est obligatoire");
      return;
    }

    const response: any = await createRole({
      nom,
      description: description || undefined,
    });

    if (response?.status !== 200) {
      toast.error(response?.message ?? "Creation du role impossible");
      return;
    }

    toast.success("Role cree avec succes");
    setRoleForm(defaultRoleForm);
    refetchRolePermissions();
  }

  function openEditRole(role: RolePermissionItem) {
    setEditRole(role);
    setEditForm({
      nom: role.nom ?? "",
      description: role.description ?? "",
    });
  }

  async function handleUpdateRole() {
    if (!editRole) {
      return;
    }

    const nom = editForm.nom.trim();
    const description = editForm.description.trim();

    if (!nom) {
      toast.error("Le nom du role est obligatoire");
      return;
    }

    const response: any = await updateRoleMeta({
      id: editRole.id,
      nom,
      description: description || undefined,
      actif: editRole.actif,
    });

    if (response?.status !== 200) {
      toast.error(response?.message ?? "Modification du role impossible");
      return;
    }

    toast.success("Role modifie avec succes");
    setEditRole(null);
    setEditForm(defaultRoleForm);
    refetchRolePermissions();
  }

  async function handleToggleRole(role: RolePermissionItem) {
    const response: any = await updateRoleMeta({
      id: role.id,
      nom: role.nom,
      description: role.description ?? undefined,
      actif: !role.actif,
    });

    if (response?.status !== 200) {
      toast.error(response?.message ?? "Changement d'etat impossible");
      return;
    }

    toast.success(role.actif ? "Role desactive" : "Role active");
    refetchRolePermissions();
  }

  async function handleDeleteRole() {
    if (!deleteRole) {
      return;
    }

    const response: any = await removeRole({ id: deleteRole.id });
    if (response?.status !== 200) {
      toast.error(response?.message ?? "Suppression impossible");
      return;
    }

    toast.success("Role supprime avec succes");
    setDeleteRole(null);
    refetchRolePermissions();
    refetchPermissions();
  }

  async function handleSaveRole(roleId: number) {
    const permissionIds = roleSelections[roleId] ?? [];
    const portees = Object.fromEntries(
      permissionIds.map((permissionId) => [
        permissionId.toString(),
        roleScopes[roleId]?.[permissionId] ?? "TOUTE_ORGANISATION",
      ])
    );

    const response: any = await updateRolePermissions({
      roleId,
      permissionIds,
      portees,
    });

    if (response?.status !== 200) {
      toast.error(response?.message ?? "Enregistrement impossible");
      return;
    }

    toast.success("Permissions du role mises a jour");
    refetchRolePermissions();
    refetchPermissions();
  }

  async function handleBootstrapPermissions() {
    const response: any = await bootstrapPermissions();

    if (response?.status !== 200) {
      toast.error(response?.message ?? "Synchronisation impossible");
      return;
    }

    toast.success(
      `${response?.data?.created ?? 0} permission(s) ajoutee(s), ${response?.data?.existing ?? 0} deja presente(s)`
    );
    refetchPermissions();
    refetchRolePermissions();
  }

  function handlePermissionPageSizeChange(value: string) {
    setPermissionPageSize(value === "all" ? -1 : Number(value));
  }

  function handleRoleListPageSizeChange(value: string) {
    setRoleListPageSize(value === "all" ? -1 : Number(value));
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-3">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="min-w-0 rounded-xl border bg-background p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em]">
                Permissions
              </h3>
              <p className="text-sm text-muted-foreground">
                Catalogue d'actions disponible dans l'application. L'administrateur choisit ensuite quelles actions chaque role peut utiliser.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleBootstrapPermissions}
              disabled={bootstrappingPermissions}
            >
              <IconLinkPlus className="mr-2 h-4 w-4" />
              {bootstrappingPermissions ? "Sync..." : "Charger le catalogue"}
            </Button>
          </div>

          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
              className="w-full md:max-w-sm"
              value={permissionSearch}
              onChange={(event) => setPermissionSearch(event.target.value)}
              placeholder="Rechercher une permission..."
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Lignes par page</span>
              <Select
                value={permissionPageSize === -1 ? "all" : permissionPageSize.toString()}
                onValueChange={handlePermissionPageSizeChange}
              >
                <SelectTrigger className="w-[92px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                  <SelectItem value="all">Tout</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredPermissions.length > 0 ? (
            <div className="space-y-4">
              {groupedPermissionCatalog.map((group) => (
                <div key={group.moduleKey} className="rounded-xl border">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <div className="text-sm font-semibold">{group.moduleLabel}</div>
                    <Badge variant="outline">{group.items.length} permission(s)</Badge>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Action</TableHead>
                        <TableHead>Utilisation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items.map((permission) => {
                        const label = formatPermissionLabel(permission.code);
                        return (
                          <TableRow key={permission.id}>
                            <TableCell>
                              <div className="font-medium">{label.title}</div>
                              <div className="text-xs text-muted-foreground">
                                {label.subtitle}
                              </div>
                              <div className="text-xs text-muted-foreground">{permission.code}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {permission._count?.rolePermission ?? 0} role(s)
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              Aucune permission trouvee
            </div>
          )}

          {filteredPermissions.length > 0 && (
            <div className="mt-4 flex flex-col gap-3 border-t px-1 pt-3 md:flex-row md:items-center md:justify-between">
              <span className="text-sm text-muted-foreground">
                {filteredPermissions.length} permission(s)
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPermissionPage(1)}
                  disabled={safePermissionPage <= 1 || permissionPageSize === -1}
                >
                  <IconChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPermissionPage((prev) => Math.max(1, prev - 1))}
                  disabled={safePermissionPage <= 1 || permissionPageSize === -1}
                >
                  <IconChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 text-sm">
                  Page {safePermissionPage} sur {permissionTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setPermissionPage((prev) => Math.min(permissionTotalPages, prev + 1))
                  }
                  disabled={safePermissionPage >= permissionTotalPages || permissionPageSize === -1}
                >
                  <IconChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPermissionPage(permissionTotalPages)}
                  disabled={safePermissionPage >= permissionTotalPages || permissionPageSize === -1}
                >
                  <IconChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0 overflow-hidden rounded-xl border bg-background p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em]">
            Nouveau role
          </h3>
          <div className="mt-3 space-y-3">
            <Input
              value={roleForm.nom}
              onChange={(event) =>
                setRoleForm((prev) => ({ ...prev, nom: event.target.value }))
              }
              placeholder="Ex: Employe, Superviseur, Direction"
            />
            <Input
              value={roleForm.description}
              onChange={(event) =>
                setRoleForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Description du role (optionnel)"
            />
            <Button type="button" onClick={handleCreateRole} disabled={creatingRole}>
              <IconPlus className="mr-2 h-4 w-4" />
              {creatingRole ? "Creation..." : "Creer le role"}
            </Button>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Le nom du role est libre. Il doit suivre le vocabulaire de votre entreprise.</p>
              <p>Les autorisations sont preparees dans l'application, puis attribuees aux roles par l'administrateur.</p>
            </div>
          </div>

          <div className="mt-6 border-t pt-4">
            <div className="mb-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-[0.12em]">
                  Roles existants
                </h4>
                <p className="text-sm text-muted-foreground">
                  Vue rapide des roles deja enregistres.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start xl:self-auto">
                <span className="text-sm text-muted-foreground">Lignes par page</span>
                <Select
                  value={roleListPageSize === -1 ? "all" : roleListPageSize.toString()}
                  onValueChange={handleRoleListPageSizeChange}
                >
                  <SelectTrigger className="w-[84px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 20].map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                    <SelectItem value="all">Tout</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredRoles.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role</TableHead>
                        <TableHead>Cle</TableHead>
                        <TableHead>Etat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRoleList.map((role) => (
                        <TableRow key={`role-list-${role.id}`}>
                          <TableCell className="min-w-[180px]">
                            <div className="font-medium">{role.nom}</div>
                            {role.description ? (
                              <div className="text-xs text-muted-foreground">
                                {role.description}
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">{role.key || "--"}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge variant={role.actif ? "default" : "secondary"}>
                              {role.actif ? "Actif" : "Inactif"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-3 flex flex-col gap-3 border-t px-1 pt-3 xl:flex-row xl:items-center xl:justify-between">
                  <span className="text-sm text-muted-foreground">
                    {filteredRoles.length} role(s)
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setRoleListPage(1)}
                      disabled={safeRoleListPage <= 1 || roleListPageSize === -1}
                    >
                      <IconChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setRoleListPage((prev) => Math.max(1, prev - 1))}
                      disabled={safeRoleListPage <= 1 || roleListPageSize === -1}
                    >
                      <IconChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-2 text-sm">
                      Page {safeRoleListPage} sur {roleListTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setRoleListPage((prev) => Math.min(roleListTotalPages, prev + 1))
                      }
                      disabled={safeRoleListPage >= roleListTotalPages || roleListPageSize === -1}
                    >
                      <IconChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setRoleListPage(roleListTotalPages)}
                      disabled={safeRoleListPage >= roleListTotalPages || roleListPageSize === -1}
                    >
                      <IconChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                Aucun role trouve
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-background p-4">
        <div className="mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.12em]">
            Attribution des permissions aux roles
          </h3>
          <p className="text-sm text-muted-foreground">
            Pour chaque role, choisissez les actions autorisees et le perimetre de donnees correspondant.
          </p>
        </div>

        <div className="mb-4 grid gap-3 rounded-xl border bg-muted/20 p-3 md:grid-cols-2 xl:grid-cols-4">
          {SCOPE_HELPERS.map((scope) => (
            <div key={scope.value} className="rounded-lg border bg-background px-3 py-2">
              <p className="text-sm font-medium">{scope.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{scope.description}</p>
            </div>
          ))}
        </div>

        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Input
            className="w-full md:max-w-sm"
            value={roleSearch}
            onChange={(event) => setRoleSearch(event.target.value)}
            placeholder="Rechercher un role..."
          />
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Afficher</span>
              <Select value={selectedRoleView} onValueChange={setSelectedRoleView}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tout</SelectItem>
                  {filteredRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-sm text-muted-foreground">
              {visibleRoles.length} role(s) affiche(s)
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {visibleRoles.length > 0 ? (
            visibleRoles.map((role) => (
              <div key={role.id} className="rounded-xl border p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{role.nom}</h4>
                      <Badge variant={role.actif ? "default" : "secondary"}>
                        {role.actif ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Cle: {role.key || "--"}
                    </p>
                    {role.description ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {role.description}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {role._count?.utilisateurs ?? 0} utilisateur(s),{" "}
                      {role._count?.rolePermission ?? 0} permission(s)
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => openEditRole(role)}
                    >
                      <IconEdit className="mr-2 h-4 w-4" />
                      Modifier
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleRole(role)}
                      disabled={updatingRole}
                    >
                      {role.actif ? "Desactiver" : "Activer"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={() => setDeleteRole(role)}
                    >
                      <IconTrash className="mr-2 h-4 w-4" />
                      Supprimer
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {assignablePermissions.length > 0 ? (
                    permissionMenuModules.map((module) => {
                      const roleSelectionSet = new Set(roleSelections[role.id] ?? []);
                      const modulePermissionIds = module.items.flatMap((item) =>
                        item.permissions.map((permission) => permission.id)
                      );
                      const moduleSelectedCount = modulePermissionIds.filter((permissionId) =>
                        roleSelectionSet.has(permissionId)
                      ).length;
                      const isOpen = Boolean(expandedModulesByRole[role.id]?.[module.moduleKey]);

                      return (
                        <div key={`${role.id}-${module.moduleKey}`} className="rounded-xl border">
                          <button
                            type="button"
                            className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left hover:bg-muted/40"
                            onClick={() => toggleModuleSection(role.id, module.moduleKey)}
                          >
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold">{module.moduleLabel}</p>
                              <Badge variant="outline">
                                {moduleSelectedCount}/{modulePermissionIds.length}
                              </Badge>
                            </div>
                            <IconChevronRight
                              className={`h-4 w-4 transition-transform ${
                                isOpen ? "rotate-90" : ""
                              }`}
                            />
                          </button>

                          {isOpen ? (
                            <div className="grid gap-3 border-t p-3 md:grid-cols-2 xl:grid-cols-3">
                              {module.items.map((item) => {
                                const itemSelectedCount = item.permissions.filter((permission) =>
                                  roleSelectionSet.has(permission.id)
                                ).length;

                                return (
                                  <button
                                    key={`${role.id}-${module.moduleKey}-${item.itemKey}`}
                                    type="button"
                                    className="rounded-lg border bg-background px-3 py-3 text-left transition-colors hover:bg-muted/30"
                                    onClick={() => openPermissionModalForItem(role, module, item)}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-sm font-medium">{item.itemLabel}</p>
                                      <Badge variant="secondary">
                                        {itemSelectedCount}/{item.permissions.length}
                                      </Badge>
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      Ouvrir les permissions et portees de cette section
                                    </p>
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                      Le catalogue d'autorisations est vide. Chargez d'abord le catalogue standard.
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              Aucun role trouve
            </div>
          )}
        </div>
      </div>

      <Dialog open={Boolean(permissionModal)} onOpenChange={() => undefined}>
        <DialogContent
          showCloseButton={false}
          className="h-[92vh] w-[98vw] max-w-[min(1400px,98vw)] sm:max-w-[min(1400px,98vw)] overflow-hidden rounded-2xl p-0"
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <div className="flex h-full flex-col">
            <DialogHeader className="border-b px-8 py-5">
              <DialogTitle>
                {permissionModal?.roleName} - {permissionModal?.moduleLabel}
              </DialogTitle>
              <DialogDescription>
                {permissionModal?.itemLabel}. Selectionnez les permissions et portees, puis enregistrez ce modal.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-end gap-2 border-b px-8 py-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  permissionModal
                    ? setModulePermissions(permissionModal.roleId, permissionModal.permissionIds, true)
                    : null
                }
                disabled={!permissionModal}
              >
                Tout cocher
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  permissionModal
                    ? setModulePermissions(permissionModal.roleId, permissionModal.permissionIds, false)
                    : null
                }
                disabled={!permissionModal}
              >
                Tout decocher
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-6">
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
                {modalPermissionItems.map((permission) => {
                  const checked = permissionModal
                    ? (roleSelections[permissionModal.roleId] ?? []).includes(permission.id)
                    : false;
                  const selectedScope = permissionModal
                    ? roleScopes[permissionModal.roleId]?.[permission.id] ?? "TOUTE_ORGANISATION"
                    : "TOUTE_ORGANISATION";

                  return (
                    <div
                      key={`modal-${permission.id}`}
                      className="flex min-h-[188px] flex-col gap-4 rounded-xl border bg-background p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-5">{permission.label.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {permission.label.subtitle}
                          </p>
                          <p className="text-xs text-muted-foreground">{permission.code}</p>
                          <p className="text-xs text-muted-foreground">
                            Utilisee dans {permissionUsage.get(permission.id) ?? 0} role(s)
                          </p>
                        </div>
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) =>
                            permissionModal
                              ? togglePermission(permissionModal.roleId, permission.id, Boolean(value))
                              : null
                          }
                        />
                      </div>

                      <div className="mt-auto flex flex-col gap-2">
                        <span className="text-xs text-muted-foreground">Portee</span>
                        <Select
                          value={selectedScope}
                          onValueChange={(value) =>
                            permissionModal
                              ? setPermissionScope(permissionModal.roleId, permission.id, value as ScopeValue)
                              : null
                          }
                          disabled={!checked || !permissionModal}
                        >
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(SCOPE_LABELS).map(([value, label]) => (
                              <SelectItem key={`modal-scope-${value}`} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="border-t px-8 py-4 sm:justify-between">
              <Button variant="outline" onClick={closePermissionModal}>
                Close
              </Button>
              <Button
                onClick={async () => {
                  if (!permissionModal) return;
                  await handleSaveRole(permissionModal.roleId);
                  closePermissionModal();
                }}
                disabled={!permissionModal || savingPermissions}
              >
                <IconDeviceFloppy className="mr-2 h-4 w-4" />
                {savingPermissions ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editRole)} onOpenChange={(open) => !open && setEditRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le role</DialogTitle>
            <DialogDescription>
              Mettez a jour le nom ou la description du role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Input
              value={editForm.nom}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, nom: event.target.value }))
              }
              placeholder="Nom du role"
            />
            <Input
              value={editForm.description}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Description du role (optionnel)"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRole(null)}>
              Annuler
            </Button>
            <Button onClick={handleUpdateRole} disabled={updatingRole}>
              {updatingRole ? "Traitement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteRole)} onOpenChange={(open) => !open && setDeleteRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce role ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action retire aussi ses attributions utilisateurs et permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingRole}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleDeleteRole();
              }}
              disabled={deletingRole}
            >
              {deletingRole ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

