"use client";

import { useMemo, useState } from "react";
import { Award, Briefcase, Building2, FileText, FolderTree, Layers3, Plus, Users } from "lucide-react";
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

type FormType = "TYPE_UNITE" | "UNITE" | "POSTE" | "FONCTION" | "GRADE" | "AFFECTATION" | null;
type ManagedType = Exclude<FormType, null>;
type RowMap = Record<string, any>;

const emptyForm = {
  id: undefined,
  nom: "",
  code: "",
  description: "",
  ordre: "0",
  typeUniteId: "",
  parentId: "",
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
    if (canRead("TYPE_UNITE")) base.push({ value: "types", label: "Types d'unite", icon: Layers3, type: "TYPE_UNITE" as const });
    if (canRead("UNITE")) {
      for (const type of types as any[]) {
        base.push({
          value: `unites-${type.id}`,
          label: type.nom,
          icon: Building2,
          type: "UNITE" as const,
          typeUniteId: type.id,
        });
      }
    }
    if (canRead("POSTE")) base.push({ value: "postes", label: "Postes", icon: Briefcase, type: "POSTE" as const });
    if (canRead("FONCTION")) base.push({ value: "fonctions", label: "Fonctions", icon: FileText, type: "FONCTION" as const });
    if (canRead("GRADE")) base.push({ value: "grades", label: "Grades", icon: Award, type: "GRADE" as const });
    if (canRead("AFFECTATION")) base.push({ value: "affectations", label: "Affectations", icon: Users, type: "AFFECTATION" as const });
    return base;
  }, [types, auth]);

  const openForm = (type: ManagedType, item?: any, preset?: RowMap) => {
    setActiveForm(type);
    setEditingItem(item ?? null);
    const base = item
      ? {
          ...emptyForm,
          ...item,
          ordre: item.ordre != null ? String(item.ordre) : "0",
          typeUniteId: item.typeUniteId != null ? String(item.typeUniteId) : "",
          parentId: item.parentId != null ? String(item.parentId) : "",
          uniteOrganisationnelleId: item.uniteOrganisationnelleId != null ? String(item.uniteOrganisationnelleId) : "",
          posteId: item.posteId != null ? String(item.posteId) : "",
          fonctionId: item.fonctionId != null ? String(item.fonctionId) : "",
          gradeId: item.gradeId != null ? String(item.gradeId) : "",
          agentId: item.agentId != null ? String(item.agentId) : "",
          dateDebut: item.dateDebut ? new Date(item.dateDebut).toISOString().slice(0, 10) : "",
          dateFin: item.dateFin ? new Date(item.dateFin).toISOString().slice(0, 10) : "",
        }
      : emptyForm;
    setFormData({ ...base, ...preset });
    setOpenDialog(true);
  };

  const refetchByType = async (type: ManagedType) => {
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
      if (activeForm === "TYPE_UNITE") {
        const payload = { nom: formData.nom, code: formData.code, description: formData.description || undefined, ordre: Number(formData.ordre || 0), actif: true };
        await (editingItem ? UpdateTypeUniteOrganisationnelle({ id: editingItem.id, ...payload }) : CreateTypeUniteOrganisationnelle(payload));
      }
      if (activeForm === "UNITE") {
        const payload = {
          nom: formData.nom,
          code: formData.code,
          description: formData.description || undefined,
          typeUniteId: Number(formData.typeUniteId),
          parentId: formData.parentId ? Number(formData.parentId) : null,
          actif: true,
        };
        await (editingItem ? UpdateUniteOrganisationnelle({ id: editingItem.id, ...payload }) : CreateUniteOrganisationnelle(payload));
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
        const payload = {
          id: editingItem?.id,
          agentId: Number(formData.agentId),
          posteId: Number(formData.posteId),
          uniteOrganisationnelleId: Number(formData.uniteOrganisationnelleId),
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

  const renderTable = (type: ManagedType, rows: any[], title: string, buttonLabel: string, onCreate?: () => void) => {
    const headers: Record<ManagedType, string[]> = {
      TYPE_UNITE: ["Nom", "Code", "Ordre", "Etat"],
      UNITE: ["Nom", "Parent", "Niveau", "Utilisation"],
      POSTE: ["Code", "Libelle", "Unite"],
      FONCTION: ["Code", "Libelle", "Poste"],
      GRADE: ["Code", "Libelle", "Indice"],
      AFFECTATION: ["Agent", "Unite", "Poste", "Fonction", "Grade", "Date debut"],
    };

    const cells = (item: any) => {
      if (type === "TYPE_UNITE") return [item.nom, item.code, item.ordre, item.systeme ? "Systeme" : item.actif ? "Actif" : "Inactif"];
      if (type === "UNITE") return [
        <div key="nom"><div className="font-medium">{item.nom}</div><div className="text-xs text-muted-foreground">{item.code}</div></div>,
        item.parent?.nom ?? "Racine",
        item.niveau,
        `${item._count?.enfants ?? 0} enfant(s) / ${item._count?.postes ?? 0} poste(s)`,
      ];
      if (type === "POSTE") return [item.code, item.libelle, item.uniteOrganisationnelle?.nom ?? "--"];
      if (type === "FONCTION") return [item.code, item.libelle, item.poste?.libelle ?? "--"];
      if (type === "GRADE") return [item.code, item.libelle, item.indiceSalarial];
      return [
        `${item.agent?.matricule} - ${item.agent?.nom} ${item.agent?.prenom}`,
        item.uniteOrganisationnelle?.nom ?? "--",
        item.poste?.libelle ?? "--",
        item.fonction?.libelle ?? "--",
        item.grade?.libelle ?? "--",
        item.dateDebut ? new Date(item.dateDebut).toLocaleDateString() : "--",
      ];
    };

    return (
      <>
        {canWrite(type) && onCreate && (
          <Button variant="outline" className="mb-2" onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {buttonLabel}
          </Button>
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
                  {canWrite(type) && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item) => (
                  <TableRow key={item.id}>
                    {cells(item).map((cell, index) => <TableCell key={`${item.id}-${index}`}>{cell}</TableCell>)}
                    {canWrite(type) && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">Actions</Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openForm(type, item)}>Modifier</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget({ id: item.id, type })}>
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={headers[type].length + (canWrite(type) ? 1 : 0)} className="text-center text-muted-foreground">
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
          <p className="text-muted-foreground">Structure dynamique basee sur les types d'unite et les unites organisationnelles.</p>
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
          Chaque type d'unite dispose maintenant de sa propre liste d'unites dans les onglets.
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
            {renderTable("TYPE_UNITE", types as any[], "Types d'unite", "Ajouter un type d'unite", () => openForm("TYPE_UNITE"))}
          </TabsContent>
        )}

        {canRead("UNITE") &&
          (types as any[]).map((typeItem) => (
            <TabsContent key={typeItem.id} value={`unites-${typeItem.id}`}>
              {renderTable(
                "UNITE",
                (unites as any[]).filter((item) => item.typeUniteId === typeItem.id),
                typeItem.nom,
                `Ajouter une unite ${String(typeItem.nom).toLowerCase()}`,
                () => openForm("UNITE", undefined, { typeUniteId: String(typeItem.id) })
              )}
            </TabsContent>
          ))}

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
              {activeForm === "TYPE_UNITE" && (editingItem ? "Modifier un type d'unite" : "Ajouter un type d'unite")}
              {activeForm === "UNITE" && (editingItem ? "Modifier une unite" : "Ajouter une unite")}
              {activeForm === "POSTE" && (editingItem ? "Modifier un poste" : "Ajouter un poste")}
              {activeForm === "FONCTION" && (editingItem ? "Modifier une fonction" : "Ajouter une fonction")}
              {activeForm === "GRADE" && (editingItem ? "Modifier un grade" : "Ajouter un grade")}
              {activeForm === "AFFECTATION" && (editingItem ? "Modifier l'affectation" : "Nouvelle affectation")}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3">
            {activeForm === "TYPE_UNITE" && (
              <>
                <Input placeholder="Nom" value={formData.nom || ""} onChange={(e) => setFormData((p: any) => ({ ...p, nom: e.target.value }))} />
                <Input placeholder="Code" value={formData.code || ""} onChange={(e) => setFormData((p: any) => ({ ...p, code: e.target.value }))} />
                <Input placeholder="Description" value={formData.description || ""} onChange={(e) => setFormData((p: any) => ({ ...p, description: e.target.value }))} />
                <Input placeholder="Ordre" type="number" value={formData.ordre || "0"} onChange={(e) => setFormData((p: any) => ({ ...p, ordre: e.target.value }))} />
              </>
            )}

            {activeForm === "UNITE" && (
              <>
                <Input placeholder="Nom" value={formData.nom || ""} onChange={(e) => setFormData((p: any) => ({ ...p, nom: e.target.value }))} />
                <Input placeholder="Code" value={formData.code || ""} onChange={(e) => setFormData((p: any) => ({ ...p, code: e.target.value }))} />
                <Input placeholder="Description" value={formData.description || ""} onChange={(e) => setFormData((p: any) => ({ ...p, description: e.target.value }))} />
                <select className="w-full rounded border p-2" value={formData.typeUniteId || ""} onChange={(e) => setFormData((p: any) => ({ ...p, typeUniteId: e.target.value }))}>
                  <option value="">-- Selectionnez le type d'unite --</option>
                  {(types as any[]).map((item) => <option key={item.id} value={item.id}>{item.nom}</option>)}
                </select>
                <select className="w-full rounded border p-2" value={formData.parentId || ""} onChange={(e) => setFormData((p: any) => ({ ...p, parentId: e.target.value }))}>
                  <option value="">-- Unite parente (optionnel) --</option>
                  {(unites as any[]).filter((item) => item.id !== editingItem?.id).map((item) => (
                    <option key={item.id} value={item.id}>{getIndent(item.niveau, item.nom)}</option>
                  ))}
                </select>
              </>
            )}

            {activeForm === "POSTE" && (
              <>
                <Input placeholder="Code" value={formData.code || ""} onChange={(e) => setFormData((p: any) => ({ ...p, code: e.target.value }))} />
                <Input placeholder="Libelle" value={formData.libelle || ""} onChange={(e) => setFormData((p: any) => ({ ...p, libelle: e.target.value }))} />
                <Input placeholder="Description" value={formData.description || ""} onChange={(e) => setFormData((p: any) => ({ ...p, description: e.target.value }))} />
                <select className="w-full rounded border p-2" value={formData.uniteOrganisationnelleId || ""} onChange={(e) => setFormData((p: any) => ({ ...p, uniteOrganisationnelleId: e.target.value }))}>
                  <option value="">-- Selectionnez l'unite --</option>
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
                <select className="w-full rounded border p-2" value={formData.uniteOrganisationnelleId || ""} onChange={(e) => setFormData((p: any) => ({ ...p, uniteOrganisationnelleId: e.target.value }))}>
                  <option value="">-- Selectionnez l'unite --</option>
                  {(unites as any[]).map((item) => <option key={item.id} value={item.id}>{getIndent(item.niveau, item.nom)}</option>)}
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

            <Button type="submit" className="w-full">{editingItem ? "Modifier" : "Enregistrer"}</Button>
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
