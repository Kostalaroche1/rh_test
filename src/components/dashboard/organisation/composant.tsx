"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Award, Briefcase, Building2, FileText, Layers3, Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { GetAgent } from "@/app/action/agent/getAgent/action";
import { CreateAffectation, DeleteAffectation, GetAffectations, UpdateAffectation } from "@/app/action/affectations/action";
import {
  CreateFonction,
  CreateGrade,
  CreatePoste,
  DeleteFonction,
  DeleteGrade,
  DeletePoste,
  GetFonctions,
  GetGrades,
  GetPostes,
  UpdateFonction,
  UpdateGrade,
  UpdatePoste,
} from "@/app/action/organisation/action";
import {
  CreateTypeUniteOrganisationnelle,
  CreateUniteOrganisationnelle,
  DeleteTypeUniteOrganisationnelle,
  DeleteUniteOrganisationnelle,
  GetTypesUnitesOrganisationnelles,
  GetUnitesOrganisationnelles,
  UpdateTypeUniteOrganisationnelle,
  UpdateUniteOrganisationnelle,
} from "@/app/action/organisation-dynamique/action";
import {
  CreateProvince,
  DeleteProvince,
  GetProvinces,
  UpdateProvince,
} from "@/app/action/provinces/action";
import { useAuth } from "@/app/contexts/auth/context";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGet } from "@/hooks/useApi";
import { hasAnyPermission } from "@/security/permissions";

type FormType =
  | "PROVINCE"
  | "TYPE_UNITE"
  | "UNITE"
  | "POSTE"
  | "FONCTION"
  | "GRADE"
  | "AFFECTATION"
  | null;
type ManagedType = Exclude<FormType, null>;
type RowMap = Record<string, any>;

const emptyForm = {
  id: undefined,
  mappingId: undefined,
  nom: "",
  code: "",
  description: "",
  provinceId: "",
  ordre: "0",
  typeUniteId: "",
  parentId: "",
  uniteExistanteId: "",
  libelle: "",
  indiceSalarial: "",
  uniteOrganisationnelleId: "",
  posteId: "",
  fonctionId: "",
  gradeId: "",
  agentId: "",
  dateDebut: "",
  dateFin: "",
  motif: "",
  type: "",
};

const permissions: Record<ManagedType, { read: string[]; write: string[] }> = {
  PROVINCE: {
    read: ["province.read"],
    write: ["province.create", "province.update", "province.delete"],
  },
  TYPE_UNITE: {
    read: ["type_unite_organisationnelle.read"],
    write: [
      "type_unite_organisationnelle.create",
      "type_unite_organisationnelle.update",
      "type_unite_organisationnelle.delete",
    ],
  },
  UNITE: {
    read: ["unite_organisationnelle.read"],
    write: ["unite_organisationnelle.create", "unite_organisationnelle.update", "unite_organisationnelle.delete"],
  },
  POSTE: { read: ["poste.read"], write: ["poste.create", "poste.update", "poste.delete"] },
  FONCTION: { read: ["fonction.read"], write: ["fonction.create", "fonction.update", "fonction.delete"] },
  GRADE: { read: ["grade.read"], write: ["grade.create", "grade.update", "grade.delete"] },
  AFFECTATION: { read: ["affectation.read"], write: ["affectation.assign", "affectation.update", "affectation.delete"] },
};

const getIndent = (niveau = 0, nom = "") => `${"-- ".repeat(niveau)}${nom}`;

export default function OrganisationDashboard() {
  const { auth }: any = useAuth();
  const [activeForm, setActiveForm] = useState<FormType>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; type: ManagedType } | null>(null);
  const [formData, setFormData] = useState<any>(emptyForm);
  const [selectedUniteTypeId, setSelectedUniteTypeId] = useState<number | null>(null);
  const [uniteDrillPath, setUniteDrillPath] = useState<number[]>([]);

  const { data: provinces = [], refetch: refetchProvinces } = useGet(
    ["provinces"],
    GetProvinces
  );
  const { data: types = [], refetch: refetchTypes } = useGet(["organisation-types"], GetTypesUnitesOrganisationnelles);
  const { data: unites = [], refetch: refetchUnites } = useGet(["organisation-unites"], GetUnitesOrganisationnelles);
  const { data: postes = [], refetch: refetchPostes } = useGet(["postes"], GetPostes);
  const { data: fonctions = [], refetch: refetchFonctions } = useGet(["fonctions"], GetFonctions);
  const { data: grades = [], refetch: refetchGrades } = useGet(["grades"], GetGrades);
  const { data: affectations = [], refetch: refetchAffectations } = useGet(["affectations"], GetAffectations);
  const { data: agents = [] } = useGet(["agents"], GetAgent);

  const canRead = (type: ManagedType) => hasAnyPermission(auth, [...permissions[type].read, ...permissions[type].write]);
  const canWrite = (type: ManagedType) => hasAnyPermission(auth, permissions[type].write);

  const tabs = useMemo(() => {
    const base = [];
    if (canRead("TYPE_UNITE")) base.push({ value: "types", label: "Stations", icon: Layers3, type: "TYPE_UNITE" as const });
    if (canRead("UNITE")) base.push({ value: "unites", label: "Directions", icon: Building2, type: "UNITE" as const });
    if (canRead("POSTE")) base.push({ value: "postes", label: "Postes", icon: Briefcase, type: "POSTE" as const });
    if (canRead("FONCTION")) base.push({ value: "fonctions", label: "Fonctions", icon: FileText, type: "FONCTION" as const });
    if (canRead("GRADE")) base.push({ value: "grades", label: "Grades", icon: Award, type: "GRADE" as const });
    if (canRead("AFFECTATION")) base.push({ value: "affectations", label: "Affectations", icon: Users, type: "AFFECTATION" as const });
    return base;
  }, [types, auth]);

  const selectedProvinceId = Number(formData.provinceId || 0);
  const selectedTypeUniteId = Number(formData.typeUniteId || 0);

  const filteredTypesByProvince = useMemo(() => {
    if (!selectedProvinceId) return [] as any[];
    return (types as any[]).filter((item) =>
      (item.typeOrgaUniteProvinces ?? []).some(
        (link: any) => Number(link.provinceId) === selectedProvinceId && link.actif !== false
      )
    );
  }, [types, selectedProvinceId]);

  const allUnitesForParent = useMemo(() => {
    const rows = unites as any[];
    const uniqueById = new Map<number, any>();
    for (const row of rows) {
      const id = Number(row.id);
      if (!uniqueById.has(id)) {
        uniqueById.set(id, row);
      }
    }
    return [...uniqueById.values()].sort((a, b) => {
      if (Number(a.niveau) !== Number(b.niveau)) return Number(a.niveau) - Number(b.niveau);
      return String(a.nom).localeCompare(String(b.nom));
    });
  }, [unites]);

  const filteredUnitesByProvinceAndType = useMemo(() => {
    if (!selectedProvinceId || !selectedTypeUniteId) return [] as any[];
    return (unites as any[]).filter(
      (item) =>
        Number(item.provinceId) === selectedProvinceId &&
        Number(item.typeUniteId) === selectedTypeUniteId
    );
  }, [unites, selectedProvinceId, selectedTypeUniteId]);

  const availableExistingUnites = useMemo(() => {
    if (!selectedProvinceId || !selectedTypeUniteId) {
      return allUnitesForParent;
    }
    return allUnitesForParent.filter(
      (unit) =>
        !(unites as any[]).some(
          (row) =>
            Number(row.id) === Number(unit.id) &&
            Number(row.provinceId) === selectedProvinceId &&
            Number(row.typeUniteId) === selectedTypeUniteId
        )
    );
  }, [allUnitesForParent, unites, selectedProvinceId, selectedTypeUniteId]);

  const unitesTypes = useMemo(() => {
    return (types as any[]).slice().sort((a, b) => String(a.nom).localeCompare(String(b.nom)));
  }, [types]);

  useEffect(() => {
    if (!selectedUniteTypeId) return;
    const exists = unitesTypes.some((item) => Number(item.id) === Number(selectedUniteTypeId));
    if (!exists) {
      setSelectedUniteTypeId(null);
      setUniteDrillPath([]);
    }
  }, [unitesTypes, selectedUniteTypeId]);

  const unitsForSelectedType = useMemo(() => {
    if (!selectedUniteTypeId) return [] as any[];
    return (unites as any[]).filter((item) => Number(item.typeUniteId) === Number(selectedUniteTypeId));
  }, [unites, selectedUniteTypeId]);

  useEffect(() => {
    if (!selectedUniteTypeId) {
      setUniteDrillPath([]);
    }
  }, [selectedUniteTypeId]);

  useEffect(() => {
    if (!uniteDrillPath.length) return;
    const validIds = new Set((unitsForSelectedType as any[]).map((item) => Number(item.id)));
    const sanitized = uniteDrillPath.filter((id) => validIds.has(Number(id)));
    if (sanitized.length !== uniteDrillPath.length) {
      setUniteDrillPath(sanitized);
    }
  }, [uniteDrillPath, unitsForSelectedType]);

  const childrenByParentForSelectedType = useMemo(() => {
    const childrenByParent = new Map<number, any[]>();
    for (const unit of unitsForSelectedType as any[]) {
      const parentKey = Number(unit.parentId || 0);
      if (!childrenByParent.has(parentKey)) {
        childrenByParent.set(parentKey, []);
      }
      childrenByParent.get(parentKey)!.push(unit);
    }
    return childrenByParent;
  }, [unitsForSelectedType]);

  const uniteChildrenStatsById = useMemo(() => {
    const unitIds = new Set<number>();
    for (const unit of unitsForSelectedType as any[]) {
      unitIds.add(Number(unit.id));
    }
    const descendantsMemo = new Map<number, number>();
    const directChildrenCount = new Map<number, number>();

    const countDescendants = (unitId: number): number => {
      if (descendantsMemo.has(unitId)) return descendantsMemo.get(unitId) ?? 0;
      const directChildren = childrenByParentForSelectedType.get(unitId) ?? [];
      let total = directChildren.length;
      for (const child of directChildren) {
        total += countDescendants(Number(child.id));
      }
      descendantsMemo.set(unitId, total);
      directChildrenCount.set(unitId, directChildren.length);
      return total;
    };

    const stats = new Map<number, { direct: number; descendants: number }>();
    for (const unitId of unitIds) {
      const descendants = countDescendants(unitId);
      stats.set(unitId, {
        direct: directChildrenCount.get(unitId) ?? 0,
        descendants,
      });
    }

    return stats;
  }, [unitsForSelectedType, childrenByParentForSelectedType]);

  const parentUnitsForSelectedType = useMemo(() => {
    const ids = new Set((unitsForSelectedType as any[]).map((item) => Number(item.id)));
    const roots = (unitsForSelectedType as any[]).filter(
      (item) => !item.parentId || !ids.has(Number(item.parentId))
    );
    return roots.sort((a, b) => String(a.nom).localeCompare(String(b.nom)));
  }, [unitsForSelectedType]);

  const selectedUniteType = useMemo(() => {
    return (unitesTypes as any[]).find((item) => Number(item.id) === Number(selectedUniteTypeId)) ?? null;
  }, [unitesTypes, selectedUniteTypeId]);

  const selectedUniteTypeProvinceId = useMemo(() => {
    const links = selectedUniteType?.typeOrgaUniteProvinces ?? [];
    const active = links.find((item: any) => item.actif !== false) ?? links[0];
    return active?.provinceId ? Number(active.provinceId) : null;
  }, [selectedUniteType]);

  const activeUniteParentId = uniteDrillPath.length
    ? Number(uniteDrillPath[uniteDrillPath.length - 1])
    : null;

  const activeUniteParent = useMemo(() => {
    if (!activeUniteParentId) return null;
    return (unitsForSelectedType as any[]).find((item) => Number(item.id) === Number(activeUniteParentId)) ?? null;
  }, [unitsForSelectedType, activeUniteParentId]);

  const activeUniteRows = useMemo(() => {
    const rows = activeUniteParentId
      ? childrenByParentForSelectedType.get(Number(activeUniteParentId)) ?? []
      : parentUnitsForSelectedType;
    return [...rows].sort((a, b) => {
      if (Number(a.niveau) !== Number(b.niveau)) return Number(a.niveau) - Number(b.niveau);
      return String(a.nom).localeCompare(String(b.nom));
    });
  }, [activeUniteParentId, childrenByParentForSelectedType, parentUnitsForSelectedType]);

  const openUniteTypeHierarchy = (typeId: number) => {
    setSelectedUniteTypeId(typeId);
    setUniteDrillPath([]);
  };

  const backUniteHierarchy = () => {
    if (uniteDrillPath.length > 0) {
      setUniteDrillPath((prev) => prev.slice(0, -1));
      return;
    }
    setSelectedUniteTypeId(null);
  };

  const viewUnitChildren = (unitId: number) => {
    setUniteDrillPath((prev) => [...prev, unitId]);
  };

  const openForm = (type: ManagedType, item?: any, preset?: RowMap) => {
    setActiveForm(type);
    setEditingItem(item ?? null);
    const base = item
      ? {
          ...emptyForm,
          ...item,
          mappingId: item.mappingId ?? undefined,
          ordre: item.ordre != null ? String(item.ordre) : "0",
          parentId: item.parentId != null ? String(item.parentId) : "",
          uniteExistanteId: item.uniteExistanteId != null ? String(item.uniteExistanteId) : "",
          uniteOrganisationnelleId: item.uniteOrganisationnelleId != null ? String(item.uniteOrganisationnelleId) : "",
          posteId: item.posteId != null ? String(item.posteId) : "",
          fonctionId: item.fonctionId != null ? String(item.fonctionId) : "",
          gradeId: item.gradeId != null ? String(item.gradeId) : "",
          agentId: item.agentId != null ? String(item.agentId) : "",
          dateDebut: item.dateDebut ? new Date(item.dateDebut).toISOString().slice(0, 10) : "",
          dateFin: item.dateFin ? new Date(item.dateFin).toISOString().slice(0, 10) : "",
          provinceId:
            item.provinceId != null
              ? String(item.provinceId)
              : item.province?.id != null
              ? String(item.province.id)
              : "",
          typeUniteId:
            item.typeUniteId != null
              ? String(item.typeUniteId)
              : item.typeUnite?.id != null
              ? String(item.typeUnite.id)
              : "",
        }
      : emptyForm;
    setFormData({ ...base, ...preset });
    setOpenDialog(true);
  };

  const refetchByType = async (type: ManagedType) => {
    if (type === "PROVINCE") await refetchProvinces();
    if (type === "TYPE_UNITE") await refetchTypes();
    if (type === "UNITE") await refetchUnites();
    if (type === "POSTE") await refetchPostes();
    if (type === "FONCTION") await refetchFonctions();
    if (type === "GRADE") await refetchGrades();
    if (type === "AFFECTATION") await refetchAffectations();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeForm) return;
    try {
      if (activeForm === "PROVINCE") {
        const payload = {
          nom: formData.nom,
          code: formData.code,
          description: formData.description || undefined,
          actif: true,
        };
        await (editingItem
          ? UpdateProvince({ id: editingItem.id, ...payload })
          : CreateProvince(payload));
      }
      if (activeForm === "TYPE_UNITE") {
        if (!Number(formData.provinceId)) {
          toast.error("Selectionnez une province avant d'enregistrer la station.");
          return;
        }
        const payload = {
          nom: formData.nom,
          code: formData.code,
          description: formData.description || undefined,
          parentId: formData.parentId ? Number(formData.parentId) : null,
          provinceId: Number(formData.provinceId),
          ordre: Number(formData.ordre || 0),
          actif: true,
        };
        await (editingItem ? UpdateTypeUniteOrganisationnelle({ id: editingItem.id, ...payload }) : CreateTypeUniteOrganisationnelle(payload));
      }
      if (activeForm === "UNITE") {
        const provinceId = Number(formData.provinceId || 0);
        const typeUniteId = Number(formData.typeUniteId || 0);
        const parentId = formData.parentId ? Number(formData.parentId) : null;
        const uniteExistanteId = formData.uniteExistanteId
          ? Number(formData.uniteExistanteId)
          : null;

        if (!provinceId || !typeUniteId) {
          toast.error("Selectionnez la province et la station.");
          return;
        }

        if (!editingItem && !uniteExistanteId && (!formData.nom || !formData.code)) {
          toast.error("Saisissez le nom et le code ou selectionnez une direction existante.");
          return;
        }

        const payload = {
          mappingId: editingItem?.mappingId ?? formData.mappingId ?? undefined,
          nom: formData.nom || undefined,
          code: formData.code || undefined,
          description: formData.description || undefined,
          provinceId,
          typeUniteId,
          parentId,
          uniteExistanteId,
          actif: true,
        };
        await (editingItem
          ? UpdateUniteOrganisationnelle({
              id: editingItem.id,
              ...payload,
            })
          : CreateUniteOrganisationnelle(payload));
      }
      if (activeForm === "POSTE") {
        const payload = { code: formData.code, libelle: formData.libelle, description: formData.description || undefined, uniteOrganisationnelleId: Number(formData.uniteOrganisationnelleId) };
        await (editingItem ? UpdatePoste({ id: editingItem.id, ...payload }) : CreatePoste(payload as any));
      }
      if (activeForm === "FONCTION") {
        const payload = { code: formData.code, libelle: formData.libelle, posteId: formData.posteId ? Number(formData.posteId) : null };
        await (editingItem ? UpdateFonction({ id: editingItem.id, ...payload }) : CreateFonction(payload as any));
      }
      if (activeForm === "GRADE") {
        const payload = { code: formData.code, libelle: formData.libelle, indiceSalarial: Number(formData.indiceSalarial) };
        await (editingItem ? UpdateGrade({ id: editingItem.id, ...payload }) : CreateGrade(payload as any));
      }
      if (activeForm === "AFFECTATION") {
        const provinceId = Number(formData.provinceId || 0);
        const typeUniteId = Number(formData.typeUniteId || 0);
        const uniteOrganisationnelleId = Number(formData.uniteOrganisationnelleId || 0);
        if (!provinceId || !typeUniteId || !uniteOrganisationnelleId) {
          toast.error("Selectionnez province, station et direction.");
          return;
        }
        const payload = {
          id: editingItem?.id,
          agentId: Number(formData.agentId),
          posteId: Number(formData.posteId),
          provinceId,
          typeUniteId,
          uniteOrganisationnelleId,
          fonctionId: formData.fonctionId ? Number(formData.fonctionId) : null,
          gradeId: Number(formData.gradeId),
          dateDebut: formData.dateDebut,
          dateFin: formData.dateFin || null,
          motif: formData.motif || null,
          type: formData.type || "AFFECTATION",
        };
        await (editingItem ? UpdateAffectation(payload) : CreateAffectation(payload as any));
      }
      toast.success("Enregistrement effectue avec succes");
      await refetchByType(activeForm);
      setOpenDialog(false);
      setEditingItem(null);
      setFormData(emptyForm);
    } catch (error) {
      console.error(error);
      toast.error("Operation impossible");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "PROVINCE") await DeleteProvince({ id: deleteTarget.id });
      if (deleteTarget.type === "TYPE_UNITE") await DeleteTypeUniteOrganisationnelle({ id: deleteTarget.id });
      if (deleteTarget.type === "UNITE") await DeleteUniteOrganisationnelle({ id: deleteTarget.id });
      if (deleteTarget.type === "POSTE") await DeletePoste(String(deleteTarget.id));
      if (deleteTarget.type === "FONCTION") await DeleteFonction(String(deleteTarget.id));
      if (deleteTarget.type === "GRADE") await DeleteGrade({ id: deleteTarget.id });
      if (deleteTarget.type === "AFFECTATION") await DeleteAffectation(String(deleteTarget.id));
      await refetchByType(deleteTarget.type);
      toast.success("Element supprime avec succes");
    } catch (error) {
      console.error(error);
      toast.error("Suppression impossible");
    } finally {
      setDeleteTarget(null);
    }
  };

  const renderTable = (
    type: ManagedType,
    rows: any[],
    title: string,
    buttonLabel: string,
    onCreate?: () => void,
    options?: {
      onBack?: () => void;
      backLabel?: string;
      onViewChildren?: (item: any) => void;
      canViewChildren?: (item: any) => boolean;
      viewChildrenLabel?: string;
    }
  ) => {
    const headers: Record<ManagedType, string[]> = {
      PROVINCE: ["Nom", "Code", "Utilisation", "Etat"],
      TYPE_UNITE: ["Nom", "Code", "Ordre", "Etat"],
      UNITE: ["Nom", "Province", "Parent", "Niveau", "Utilisation"],
      POSTE: ["Code", "Libelle", "Direction"],
      FONCTION: ["Code", "Libelle", "Poste"],
      GRADE: ["Code", "Libelle", "Indice"],
      AFFECTATION: ["Agent", "Province", "Direction", "Poste", "Fonction", "Grade", "Date debut"],
    };

    const cells = (item: any) => {
      if (type === "PROVINCE")
        return [
          item.nom,
          item.code,
          `${item._count?.types ?? 0} station(s) / ${item._count?.unites ?? 0} direction(s) / ${item._count?.affectations ?? 0} affectation(s)`,
          item.actif ? "Actif" : "Inactif",
        ];
      if (type === "TYPE_UNITE") return [item.nom, item.code, item.ordre, item.systeme ? "Systeme" : item.actif ? "Actif" : "Inactif"];
      if (type === "UNITE") {
        const stats = uniteChildrenStatsById.get(Number(item.id));
        const directChildren = stats?.direct ?? Number(item._count?.enfants ?? 0);
        const descendants = stats?.descendants ?? directChildren;
        return [
          <div key="nom"><div className="font-medium">{item.nom}</div><div className="text-xs text-muted-foreground">{item.code}</div></div>,
          item.province?.nom ?? "--",
          item.parent?.nom ?? "Racine",
          item.niveau,
          `${directChildren} enfant(s) direct(s) / ${descendants} descendant(s) / ${item._count?.postes ?? 0} poste(s)`,
        ];
      }
      if (type === "POSTE") return [item.code, item.libelle, item.uniteOrganisationnelle?.nom ?? "--"];
      if (type === "FONCTION") return [item.code, item.libelle, item.poste?.libelle ?? "--"];
      if (type === "GRADE") return [item.code, item.libelle, item.indiceSalarial];
      return [
        `${item.agent?.matricule} - ${item.agent?.nom} ${item.agent?.prenom}`,
        item.province?.nom ?? "--",
        item.uniteOrganisationnelle?.nom ?? "--",
        item.poste?.libelle ?? "--",
        item.fonction?.libelle ?? "--",
        item.grade?.libelle ?? "--",
        item.dateDebut ? new Date(item.dateDebut).toLocaleDateString() : "--",
      ];
    };

    const showActionColumn =
      canWrite(type) || (type === "UNITE" && Boolean(options?.onViewChildren));

    return (
      <>
        {(options?.onBack || (canWrite(type) && onCreate)) && (
          <div className="mb-2 flex flex-wrap gap-2">
            {options?.onBack && (
              <Button variant="outline" onClick={options.onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {options.backLabel ?? "Retour"}
              </Button>
            )}
            {canWrite(type) && onCreate && (
              <Button variant="outline" onClick={onCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {buttonLabel}
              </Button>
            )}
          </div>
        )}
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers[type].map((header) => <TableHead key={header}>{header}</TableHead>)}
                  {showActionColumn && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item) => (
                  <TableRow key={item.mappingId ?? item.id}>
                    {cells(item).map((cell, index) => <TableCell key={`${item.mappingId ?? item.id}-${index}`}>{cell}</TableCell>)}
                    {showActionColumn && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {type === "UNITE" &&
                            options?.onViewChildren &&
                            (options.canViewChildren?.(item) ?? false) && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => options.onViewChildren?.(item)}
                              >
                                {options.viewChildrenLabel ?? "Voir"}
                              </Button>
                            )}

                          {canWrite(type) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline">Actions</Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openForm(type, item)}>Modifier</DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() =>
                                    setDeleteTarget({
                                      id:
                                        type === "UNITE"
                                          ? Number(item.mappingId ?? item.typeOrgaUniteProvinceId ?? item.id)
                                          : item.id,
                                      type,
                                    })
                                  }
                                >
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={headers[type].length + (showActionColumn ? 1 : 0)} className="text-center text-muted-foreground">
                      Aucune donnee
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </>
    );
  };

  if (tabs.length === 0) {
    return (
      <div className="erp-page">
        <div>
          <h1 className="text-3xl font-bold">Espace organisation</h1>
          <p className="text-muted-foreground">Structure dynamique basee sur les stations et les directions organisationnelles.</p>
        </div>
        <Separator />
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Aucun acces en lecture sur le module organisation.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="erp-page">
      <div>
        <h1 className="text-3xl font-bold">Espace organisation</h1>
        <p className="text-muted-foreground">
          Naviguez par station, puis par direction pour consulter les bureaux.
        </p>
      </div>
      <Separator />

      <Tabs defaultValue={tabs[0].value} className="w-full">
        <TabsList className="flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value}>
                <Icon className="mr-2 h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {canRead("TYPE_UNITE") && (
          <TabsContent value="types">
            {renderTable("TYPE_UNITE", types as any[], "Stations", "Ajouter une station", () => openForm("TYPE_UNITE"))}
          </TabsContent>
        )}

        {canRead("UNITE") && (
          <TabsContent value="unites" className="space-y-4">
            {!selectedUniteTypeId ? (
              <Card>
                <CardHeader>
                  <CardTitle>Stations</CardTitle>
                </CardHeader>
                <CardContent>
                  {unitesTypes.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {unitesTypes.map((typeItem: any) => (
                        <button
                          key={typeItem.id}
                          type="button"
                          onClick={() => openUniteTypeHierarchy(Number(typeItem.id))}
                          className="rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary/60"
                        >
                          <div className="flex items-start gap-3">
                            <div className="rounded-md border p-2">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">{typeItem.nom}</p>
                              <p className="text-xs text-muted-foreground">{typeItem.code}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Aucune station disponible.
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              renderTable(
                "UNITE",
                activeUniteRows,
                activeUniteParent
                  ? `Bureaux de ${activeUniteParent.nom}`
                  : `Directions de ${selectedUniteType?.nom ?? "--"}`,
                activeUniteParent
                  ? `Ajouter un bureau (${String(selectedUniteType?.nom ?? "").toLowerCase()})`
                  : `Ajouter une direction (${String(selectedUniteType?.nom ?? "").toLowerCase()})`,
                canWrite("UNITE")
                  ? () =>
                      openForm("UNITE", undefined, {
                        typeUniteId: String(selectedUniteTypeId ?? ""),
                        provinceId: selectedUniteTypeProvinceId
                          ? String(selectedUniteTypeProvinceId)
                          : "",
                        parentId: activeUniteParent ? String(activeUniteParent.id) : "",
                      })
                  : undefined,
                {
                  onBack: backUniteHierarchy,
                  backLabel:
                    uniteDrillPath.length > 0
                      ? "Retour"
                      : "Retour aux stations",
                  onViewChildren: (item) => viewUnitChildren(Number(item.id)),
                  canViewChildren: (item) =>
                    (uniteChildrenStatsById.get(Number(item.id))?.direct ??
                      Number(item._count?.enfants ?? 0)) > 0,
                  viewChildrenLabel: "Voir",
                }
              )
            )}
          </TabsContent>
        )}

        {canRead("POSTE") && (
          <TabsContent value="postes">
            {renderTable("POSTE", postes as any[], "Postes", "Ajouter un poste", () => openForm("POSTE"))}
          </TabsContent>
        )}

        {canRead("FONCTION") && (
          <TabsContent value="fonctions">
            {renderTable("FONCTION", fonctions as any[], "Fonctions", "Ajouter une fonction", () => openForm("FONCTION"))}
          </TabsContent>
        )}

        {canRead("GRADE") && (
          <TabsContent value="grades">
            {renderTable("GRADE", grades as any[], "Grades", "Ajouter un grade", () => openForm("GRADE"))}
          </TabsContent>
        )}

        {canRead("AFFECTATION") && (
          <TabsContent value="affectations">
            {renderTable("AFFECTATION", affectations as any[], "Affectations", "Nouvelle affectation", () => openForm("AFFECTATION"))}
          </TabsContent>
        )}

      </Tabs>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeForm === "PROVINCE" && (editingItem ? "Modifier une province" : "Ajouter une province")}
              {activeForm === "TYPE_UNITE" && (editingItem ? "Modifier une station" : "Ajouter une station")}
              {activeForm === "UNITE" && (editingItem ? "Modifier une direction" : "Ajouter une direction")}
              {activeForm === "POSTE" && (editingItem ? "Modifier un poste" : "Ajouter un poste")}
              {activeForm === "FONCTION" && (editingItem ? "Modifier une fonction" : "Ajouter une fonction")}
              {activeForm === "GRADE" && (editingItem ? "Modifier un grade" : "Ajouter un grade")}
              {activeForm === "AFFECTATION" && (editingItem ? "Modifier l'affectation" : "Nouvelle affectation")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            {activeForm === "PROVINCE" && (
              <>
                <Input
                  placeholder="Nom"
                  value={formData.nom || ""}
                  onChange={(e) =>
                    setFormData((p: any) => ({ ...p, nom: e.target.value }))
                  }
                />
                <Input
                  placeholder="Code (ex: KIN)"
                  value={formData.code || ""}
                  onChange={(e) =>
                    setFormData((p: any) => ({ ...p, code: e.target.value.toUpperCase() }))
                  }
                />
                <Input
                  placeholder="Description"
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData((p: any) => ({ ...p, description: e.target.value }))
                  }
                />
              </>
            )}

            {activeForm === "TYPE_UNITE" && (
              <>
                <Input placeholder="Nom" value={formData.nom || ""} onChange={(e) => setFormData((p: any) => ({ ...p, nom: e.target.value }))} />
                <Input placeholder="Code" value={formData.code || ""} onChange={(e) => setFormData((p: any) => ({ ...p, code: e.target.value }))} />
                <Input placeholder="Description" value={formData.description || ""} onChange={(e) => setFormData((p: any) => ({ ...p, description: e.target.value }))} />
                <Input placeholder="Ordre" type="number" value={formData.ordre || "0"} onChange={(e) => setFormData((p: any) => ({ ...p, ordre: e.target.value }))} />
                <p className="text-xs font-medium text-muted-foreground">Province de rattachement</p>
                <select
                  className="w-full rounded border p-2"
                  value={formData.provinceId || ""}
                  onChange={(e) => setFormData((p: any) => ({ ...p, provinceId: e.target.value, parentId: "" }))}
                >
                  <option value="">-- Selectionnez la province --</option>
                  {(provinces as any[]).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nom}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded border p-2"
                  value={formData.parentId || ""}
                  onChange={(e) => setFormData((p: any) => ({ ...p, parentId: e.target.value }))}
                >
                  <option value="">-- Station parente (toutes provinces, optionnel) --</option>
                  {(unitesTypes as any[])
                    .filter((item) => Number(item.id) !== Number(editingItem?.id))
                    .map((item) => {
                      const provinceNames = [
                        ...new Set(
                          (item.typeOrgaUniteProvinces ?? [])
                            .filter((link: any) => link.actif !== false)
                            .map((link: any) => link?.province?.nom)
                            .filter(Boolean)
                        ),
                      ].join(", ");
                      return (
                      <option key={item.id} value={item.id}>
                        {item.parentId ? "-- " : ""}
                        {item.nom}
                        {provinceNames ? ` (${provinceNames})` : ""}
                      </option>
                      );
                    })}
                </select>
              </>
            )}

            {activeForm === "UNITE" && (
              <>
                <p className="text-xs font-medium text-muted-foreground">
                  Province (obligatoire)
                </p>
                <select
                  className="w-full rounded border p-2"
                  value={formData.provinceId || ""}
                  onChange={(e) =>
                    setFormData((p: any) => ({
                      ...p,
                      provinceId: e.target.value,
                      typeUniteId: "",
                      parentId: "",
                      uniteExistanteId: "",
                    }))
                  }
                >
                  <option value="">-- Selectionnez la province --</option>
                  {(provinces as any[]).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nom}
                    </option>
                  ))}
                </select>
                {Array.isArray(provinces) && provinces.length === 0 ? (
                  <p className="text-xs text-destructive">
                    Aucune province disponible. Verifiez migration/seed et permission `province.read`.
                  </p>
                ) : null}
                <select
                  className="w-full rounded border p-2"
                  value={formData.typeUniteId || ""}
                  onChange={(e) =>
                    setFormData((p: any) => ({
                      ...p,
                      typeUniteId: e.target.value,
                      parentId: "",
                      uniteExistanteId: "",
                    }))
                  }
                >
                  <option value="">-- Selectionnez la station --</option>
                  {filteredTypesByProvince.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nom}
                    </option>
                  ))}
                </select>
                {!editingItem && (
                  <select
                    className="w-full rounded border p-2"
                    value={formData.uniteExistanteId || ""}
                    onChange={(e) => setFormData((p: any) => ({ ...p, uniteExistanteId: e.target.value }))}
                  >
                    <option value="">-- Nouvelle direction (par defaut) --</option>
                    {availableExistingUnites.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.code} - {item.nom}
                      </option>
                    ))}
                  </select>
                )}
                {!formData.uniteExistanteId && (
                  <>
                    <Input placeholder="Nom" value={formData.nom || ""} onChange={(e) => setFormData((p: any) => ({ ...p, nom: e.target.value }))} />
                    <Input placeholder="Code" value={formData.code || ""} onChange={(e) => setFormData((p: any) => ({ ...p, code: e.target.value }))} />
                    <Input placeholder="Description" value={formData.description || ""} onChange={(e) => setFormData((p: any) => ({ ...p, description: e.target.value }))} />
                  </>
                )}
                <select
                  className="w-full rounded border p-2"
                  value={formData.parentId || ""}
                  onChange={(e) => setFormData((p: any) => ({ ...p, parentId: e.target.value }))}
                >
                  <option value="">-- Direction parente (toutes provinces, optionnel) --</option>
                  {allUnitesForParent
                    .filter((item) => Number(item.id) !== Number(editingItem?.id))
                    .map((item) => (
                    <option key={`${item.id}-${item.mappingId ?? "x"}`} value={item.id}>
                      {getIndent(item.niveau, item.nom)}
                      {item.province?.nom ? ` (${item.province.nom})` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Si aucune direction parente n'est choisie, cette direction sera racine.
                </p>
              </>
            )}

            {activeForm === "POSTE" && (
              <>
                <Input placeholder="Code" value={formData.code || ""} onChange={(e) => setFormData((p: any) => ({ ...p, code: e.target.value }))} />
                <Input placeholder="Libelle" value={formData.libelle || ""} onChange={(e) => setFormData((p: any) => ({ ...p, libelle: e.target.value }))} />
                <Input placeholder="Description" value={formData.description || ""} onChange={(e) => setFormData((p: any) => ({ ...p, description: e.target.value }))} />
                <select className="w-full rounded border p-2" value={formData.uniteOrganisationnelleId || ""} onChange={(e) => setFormData((p: any) => ({ ...p, uniteOrganisationnelleId: e.target.value }))}>
                  <option value="">-- Selectionnez la direction --</option>
                  {(unites as any[]).map((item) => <option key={item.id} value={item.id}>{getIndent(item.niveau, item.nom)}</option>)}
                </select>
              </>
            )}

            {activeForm === "FONCTION" && (
              <>
                <Input placeholder="Code" value={formData.code || ""} onChange={(e) => setFormData((p: any) => ({ ...p, code: e.target.value }))} />
                <Input placeholder="Libelle" value={formData.libelle || ""} onChange={(e) => setFormData((p: any) => ({ ...p, libelle: e.target.value }))} />
                <select className="w-full rounded border p-2" value={formData.posteId || ""} onChange={(e) => setFormData((p: any) => ({ ...p, posteId: e.target.value }))}>
                  <option value="">-- Selectionnez le poste --</option>
                  {(postes as any[]).map((item) => <option key={item.id} value={item.id}>{item.libelle}</option>)}
                </select>
              </>
            )}

            {activeForm === "GRADE" && (
              <>
                <Input placeholder="Code" value={formData.code || ""} onChange={(e) => setFormData((p: any) => ({ ...p, code: e.target.value }))} />
                <Input placeholder="Libelle" value={formData.libelle || ""} onChange={(e) => setFormData((p: any) => ({ ...p, libelle: e.target.value }))} />
                <Input placeholder="Indice salarial" type="number" value={formData.indiceSalarial || ""} onChange={(e) => setFormData((p: any) => ({ ...p, indiceSalarial: e.target.value }))} />
              </>
            )}

            {activeForm === "AFFECTATION" && (
              <>
                <select className="w-full rounded border p-2" value={formData.agentId || ""} onChange={(e) => setFormData((p: any) => ({ ...p, agentId: e.target.value }))}>
                  <option value="">-- Selectionnez l'agent --</option>
                  {(agents as any[]).filter((item) => item?.compteAgent?.agent).map((item) => (
                    <option key={item.compteAgent.agent.id} value={item.compteAgent.agent.id}>
                      {item.compteAgent.agent.matricule} - {item.compteAgent.agent.nom} {item.compteAgent.agent.prenom}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded border p-2"
                  value={formData.provinceId || ""}
                  onChange={(e) =>
                    setFormData((p: any) => ({
                      ...p,
                      provinceId: e.target.value,
                      typeUniteId: "",
                      uniteOrganisationnelleId: "",
                    }))
                  }
                >
                  <option value="">-- Selectionnez la province --</option>
                  {(provinces as any[]).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nom}
                    </option>
                  ))}
                </select>
                <select
                  className="w-full rounded border p-2"
                  value={formData.typeUniteId || ""}
                  onChange={(e) =>
                    setFormData((p: any) => ({
                      ...p,
                      typeUniteId: e.target.value,
                      uniteOrganisationnelleId: "",
                    }))
                  }
                >
                  <option value="">-- Selectionnez la station --</option>
                  {filteredTypesByProvince.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nom}
                    </option>
                  ))}
                </select>
                <select className="w-full rounded border p-2" value={formData.uniteOrganisationnelleId || ""} onChange={(e) => setFormData((p: any) => ({ ...p, uniteOrganisationnelleId: e.target.value }))}>
                  <option value="">-- Selectionnez la direction --</option>
                  {filteredUnitesByProvinceAndType.map((item) => (
                    <option key={`${item.id}-${item.mappingId ?? "x"}`} value={item.id}>
                      {getIndent(item.niveau, item.nom)}
                    </option>
                  ))}
                </select>
                <select className="w-full rounded border p-2" value={formData.posteId || ""} onChange={(e) => setFormData((p: any) => ({ ...p, posteId: e.target.value }))}>
                  <option value="">-- Selectionnez le poste --</option>
                  {(postes as any[]).map((item) => <option key={item.id} value={item.id}>{item.libelle}</option>)}
                </select>
                <select className="w-full rounded border p-2" value={formData.fonctionId || ""} onChange={(e) => setFormData((p: any) => ({ ...p, fonctionId: e.target.value }))}>
                  <option value="">-- Selectionnez la fonction --</option>
                  {(fonctions as any[]).map((item) => <option key={item.id} value={item.id}>{item.libelle}</option>)}
                </select>
                <select className="w-full rounded border p-2" value={formData.gradeId || ""} onChange={(e) => setFormData((p: any) => ({ ...p, gradeId: e.target.value }))}>
                  <option value="">-- Selectionnez le grade --</option>
                  {(grades as any[]).map((item) => <option key={item.id} value={item.id}>{item.libelle}</option>)}
                </select>
                <Input type="date" value={formData.dateDebut || ""} onChange={(e) => setFormData((p: any) => ({ ...p, dateDebut: e.target.value }))} />
                <Input type="date" value={formData.dateFin || ""} onChange={(e) => setFormData((p: any) => ({ ...p, dateFin: e.target.value }))} />
                <Input placeholder="Motif" value={formData.motif || ""} onChange={(e) => setFormData((p: any) => ({ ...p, motif: e.target.value }))} />
                <select className="w-full rounded border p-2" value={formData.type || ""} onChange={(e) => setFormData((p: any) => ({ ...p, type: e.target.value }))}>
                  <option value="">-- Selectionnez le type d'affectation --</option>
                  <option value="PROMOTION">Promotion</option>
                  <option value="MUTATION">Mutation</option>
                  <option value="NOMINATION">Nomination</option>
                  <option value="AFFECTATION">Affectation</option>
                  <option value="INTERIM">Interim</option>
                  <option value="REINTEGRATION">Reintegration</option>
                  <option value="DETACHEMENT">Detachement</option>
                  <option value="MONTEE_GRADE">Montee en grade</option>
                  <option value="RETROGRADATION">Retrogradation</option>
                </select>
              </>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={
                activeForm === "UNITE" &&
                (!Number(formData.provinceId) ||
                  !Number(formData.typeUniteId) ||
                  !Array.isArray(provinces) ||
                  provinces.length === 0)
              }
            >
              {editingItem ? "Modifier" : "Enregistrer"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>Etes-vous sur de vouloir supprimer cet element ? Cette action est irreversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); handleDelete(); }}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

