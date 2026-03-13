"use client";

import Select from "react-select";
import { useMemo, useState } from "react";
import { Award, Briefcase, Building, FileText, Layers, MapPin, Users } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/app/contexts/auth/context";
import { GetAgent } from "@/app/action/agent/getAgent/action";
import { CreateAffectation, DeleteAffectation, GetAffectations, UpdateAffectation } from "@/app/action/affectations/action";
import {
  CreateDepartement,
  CreateDirection,
  CreateFonction,
  CreateGrade,
  CreatePoste,
  CreateSite,
  DeleteDepartement,
  DeleteDirection,
  DeleteFonction,
  DeleteGrade,
  DeletePoste,
  DeleteSite,
  GetDepartements,
  GetDirections,
  GetFonctions,
  GetGrades,
  GetPostes,
  GetSites,
  UpdateDepartement,
  UpdateDirection,
  UpdateFonction,
  UpdateGrade,
  UpdatePoste,
  UpdateSite,
} from "@/app/action/organisation/action";
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
import { appReactSelectStyles } from "@/components/ui/react-select-theme";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export type ActiveForm = "SITE" | "DIRECTION" | "STRUCTURE" | "POSTE" | "FONCTION" | "GRADE" | "AFFECTATION" | null;

type SelectOption = { value: number; label: string };

const emptyForm = {
  id: undefined,
  nom: "",
  ville: "",
  adresse: "",
  code: "",
  libelle: "",
  indiceSalarial: "",
  directionId: "",
  departementId: "",
  posteId: "",
  fonctionId: "",
  gradeId: "",
  siteId: "",
  agentId: "",
  dateDebut: "",
  motif: "",
  type: "",
};

export default function OrganisationDashboard() {
  const { auth }: any = useAuth();
  const selectThemeProps = { styles: appReactSelectStyles };

  const [openDialog, setOpenDialog] = useState(false);
  const [activeForm, setActiveForm] = useState<ActiveForm>(null);
  const [formData, setFormData] = useState<any>(emptyForm);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: ActiveForm } | null>(null);

  const { data: sitesRaw = [], refetch: refetchSites } = useGet(["sites"], GetSites);
  const { data: directionsRaw = [], refetch: refetchDirections } = useGet(["directions"], GetDirections);
  const { data: departementsRaw = [], refetch: refetchDepartements } = useGet(["departements"], GetDepartements);
  const { data: affectationsRaw = [], refetch: refetchAffectations } = useGet(["affectations"], GetAffectations);
  const { data: agentsRaw = [] } = useGet(["agents"], GetAgent);
  const { data: postesRaw = [], refetch: refetchPostes } = useGet(["postes"], GetPostes);
  const { data: fonctionsRaw = [], refetch: refetchFonctions } = useGet(["fonctions"], GetFonctions);
  const { data: gradesRaw = [], refetch: refetchGrades } = useGet(["grades"], GetGrades);

  const sites = Array.isArray(sitesRaw) ? sitesRaw as any[] : [];
  const directions = Array.isArray(directionsRaw) ? directionsRaw as any[] : [];
  const departements = Array.isArray(departementsRaw) ? departementsRaw as any[] : [];
  const affectations = Array.isArray(affectationsRaw) ? affectationsRaw as any[] : [];
  const agents = Array.isArray(agentsRaw) ? agentsRaw as any[] : [];
  const postes = Array.isArray(postesRaw) ? postesRaw as any[] : [];
  const fonctions = Array.isArray(fonctionsRaw) ? fonctionsRaw as any[] : [];
  const grades = Array.isArray(gradesRaw) ? gradesRaw as any[] : [];

  const permissionsByType: Record<Exclude<ActiveForm, null>, { read: string[]; write: string[] }> = {
    SITE: { read: ["site.read"], write: ["site.create", "site.update", "site.delete"] },
    DIRECTION: { read: ["direction.read"], write: ["direction.create", "direction.update", "direction.delete"] },
    STRUCTURE: { read: ["departement.read"], write: ["departement.create", "departement.update", "departement.delete"] },
    POSTE: { read: ["poste.read"], write: ["poste.create", "poste.update", "poste.delete"] },
    FONCTION: { read: ["fonction.read"], write: ["fonction.create", "fonction.update", "fonction.delete"] },
    GRADE: { read: ["grade.read"], write: ["grade.create", "grade.update", "grade.delete"] },
    AFFECTATION: { read: ["affectation.read"], write: ["affectation.create", "affectation.update", "affectation.delete"] },
  };

  const canRead = (type: Exclude<ActiveForm, null>) => hasAnyPermission(auth, [...permissionsByType[type].read, ...permissionsByType[type].write]);
  const canWrite = (type: Exclude<ActiveForm, null>) => hasAnyPermission(auth, permissionsByType[type].write);

  const tabs = [
    { value: "sites", label: "Sites", type: "SITE" as const, icon: MapPin },
    { value: "directions", label: "Directions", type: "DIRECTION" as const, icon: Building },
    { value: "structure", label: "Services", type: "STRUCTURE" as const, icon: Layers },
    { value: "postes", label: "Postes", type: "POSTE" as const, icon: Briefcase },
    { value: "fonctions", label: "Fonctions", type: "FONCTION" as const, icon: FileText },
    { value: "grades", label: "Grades", type: "GRADE" as const, icon: Award },
    { value: "affectations", label: "Affectations", type: "AFFECTATION" as const, icon: Users },
  ].filter((tab) => canRead(tab.type));

  function openForm(type: Exclude<ActiveForm, null>, item?: any) {
    setActiveForm(type);
    setEditingItem(item ?? null);
    setFormData(item ? { ...emptyForm, ...item } : emptyForm);
    setOpenDialog(true);
  }

  function confirmDelete(id: string, type: Exclude<ActiveForm, null>) {
    setItemToDelete({ id, type });
    setOpenDeleteDialog(true);
  }

  async function refetchByType(type: Exclude<ActiveForm, null>) {
    switch (type) {
      case "SITE": await refetchSites(); break;
      case "DIRECTION": await refetchDirections(); break;
      case "STRUCTURE": await refetchDepartements(); break;
      case "POSTE": await refetchPostes(); break;
      case "FONCTION": await refetchFonctions(); break;
      case "GRADE": await refetchGrades(); break;
      case "AFFECTATION": await refetchAffectations(); break;
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeForm) return;

    try {
      if (activeForm === "SITE") {
        await (editingItem ? UpdateSite({ ...formData, id: editingItem.id }) : CreateSite(formData));
      } else if (activeForm === "DIRECTION") {
        await (editingItem ? UpdateDirection({ ...formData, id: editingItem.id }) : CreateDirection(formData));
      } else if (activeForm === "STRUCTURE") {
        await (editingItem ? UpdateDepartement({ ...formData, id: editingItem.id }) : CreateDepartement(formData));
      } else if (activeForm === "POSTE") {
        await (editingItem ? UpdatePoste({ ...formData, id: editingItem.id }) : CreatePoste(formData));
      } else if (activeForm === "FONCTION") {
        await (editingItem ? UpdateFonction({ ...formData, id: editingItem.id }) : CreateFonction(formData));
      } else if (activeForm === "GRADE") {
        await (editingItem ? UpdateGrade({ ...formData, id: editingItem.id }) : CreateGrade(formData));
      } else if (activeForm === "AFFECTATION") {
        const payload = { ...formData, id: editingItem?.id ?? formData.id };
        await (editingItem ? UpdateAffectation(payload) : CreateAffectation(payload));
      }

      toast.success(`${activeForm.toLowerCase()} ${editingItem ? "modifie" : "cree"} avec succes`);
      await refetchByType(activeForm);
      setOpenDialog(false);
      setEditingItem(null);
      setFormData(emptyForm);
    } catch (error) {
      console.error(error);
      toast.error("Operation impossible");
    }
  }

  async function handleDelete() {
    if (!itemToDelete) return;
    try {
      switch (itemToDelete.type) {
        case "SITE": await DeleteSite(itemToDelete.id); break;
        case "DIRECTION": await DeleteDirection(itemToDelete.id); break;
        case "STRUCTURE": await DeleteDepartement(itemToDelete.id); break;
        case "POSTE": await DeletePoste(itemToDelete.id); break;
        case "FONCTION": await DeleteFonction(itemToDelete.id); break;
        case "GRADE": await DeleteGrade(itemToDelete.id); break;
        case "AFFECTATION": await DeleteAffectation(itemToDelete.id); break;
      }
      await refetchByType(itemToDelete.type as Exclude<ActiveForm, null>);
      toast.success("Element supprime avec succes");
    } catch (error) {
      console.error(error);
      toast.error("Suppression impossible");
    } finally {
      setOpenDeleteDialog(false);
      setItemToDelete(null);
    }
  }

  const agentOptions: SelectOption[] = agents.map((item) => ({ value: item.compteAgent.agent.id, label: `${item.compteAgent.agent.matricule} - ${item.compteAgent.agent.nom} ${item.compteAgent.agent.prenom}` }));
  const option = (items: any[], labelKey: string): SelectOption[] => items.map((item) => ({ value: item.id, label: item[labelKey] }));

  function renderTable(type: Exclude<ActiveForm, null>, data: any[]) {
    return (
      <Card>
        <CardHeader><CardTitle>{tabs.find((tab) => tab.type === type)?.label}</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {type === "SITE" && <><TableHead>Nom</TableHead><TableHead>Ville</TableHead><TableHead>Adresse</TableHead></>}
                {type === "DIRECTION" && <><TableHead>Code</TableHead><TableHead>Libelle</TableHead></>}
                {type === "STRUCTURE" && <><TableHead>Code</TableHead><TableHead>Nom</TableHead><TableHead>Direction</TableHead></>}
                {type === "POSTE" && <><TableHead>Code</TableHead><TableHead>Libelle</TableHead><TableHead>Departement</TableHead></>}
                {type === "FONCTION" && <><TableHead>Code</TableHead><TableHead>Libelle</TableHead><TableHead>Poste</TableHead></>}
                {type === "GRADE" && <><TableHead>Code</TableHead><TableHead>Libelle</TableHead><TableHead>Indice</TableHead></>}
                {type === "AFFECTATION" && <><TableHead>Agent</TableHead><TableHead>Poste</TableHead><TableHead>Fonction</TableHead><TableHead>Grade</TableHead><TableHead>Direction</TableHead></>}
                {canWrite(type) && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.id}>
                  {type === "SITE" && <><TableCell>{item.nom}</TableCell><TableCell>{item.ville}</TableCell><TableCell>{item.adresse}</TableCell></>}
                  {type === "DIRECTION" && <><TableCell>{item.code}</TableCell><TableCell>{item.libelle}</TableCell></>}
                  {type === "STRUCTURE" && <><TableCell>{item.code}</TableCell><TableCell>{item.nom}</TableCell><TableCell>{item.direction?.libelle}</TableCell></>}
                  {type === "POSTE" && <><TableCell>{item.code}</TableCell><TableCell>{item.libelle}</TableCell><TableCell>{item.departement?.nom}</TableCell></>}
                  {type === "FONCTION" && <><TableCell>{item.code}</TableCell><TableCell>{item.libelle}</TableCell><TableCell>{item.poste?.libelle}</TableCell></>}
                  {type === "GRADE" && <><TableCell>{item.code}</TableCell><TableCell>{item.libelle}</TableCell><TableCell>{item.indiceSalarial}</TableCell></>}
                  {type === "AFFECTATION" && <><TableCell>{item.agent?.matricule}</TableCell><TableCell>{item.poste?.libelle}</TableCell><TableCell>{item.fonction?.libelle}</TableCell><TableCell>{item.grade?.libelle}</TableCell><TableCell>{item.direction?.libelle}</TableCell></>}
                  {canWrite(type) && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="outline" size="sm">Actions</Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openForm(type, item)}>Modifier</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => confirmDelete(item.id, type)} className="text-destructive">Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={canWrite(type) ? 6 : 5} className="text-center text-muted-foreground">Aucune donnee</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="erp-page">
      <div>
        <h1 className="text-3xl font-bold">Espace organisation</h1>
        <p className="text-muted-foreground">Gestion complete : sites, directions, structures, postes, fonctions, grades, affectations</p>
      </div>

      <Separator />

      {tabs.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Aucun acces en lecture sur le module organisation.</CardContent></Card>
      ) : (
        <Tabs defaultValue={tabs[0].value} className="w-full">
          <TabsList className="flex-wrap gap-2">
            {tabs.map((tab) => <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>)}
          </TabsList>

          {canRead("SITE") && <TabsContent value="sites">{canWrite("SITE") && <Button variant="outline" className="mb-2" onClick={() => openForm("SITE")}><MapPin className="mr-2 h-4 w-4" />Ajouter un site</Button>}{renderTable("SITE", sites)}</TabsContent>}
          {canRead("DIRECTION") && <TabsContent value="directions">{canWrite("DIRECTION") && <Button variant="outline" className="mb-2" onClick={() => openForm("DIRECTION")}><Building className="mr-2 h-4 w-4" />Ajouter une direction</Button>}{renderTable("DIRECTION", directions)}</TabsContent>}
          {canRead("STRUCTURE") && <TabsContent value="structure">{canWrite("STRUCTURE") && <Button variant="outline" className="mb-2" onClick={() => openForm("STRUCTURE")}><Layers className="mr-2 h-4 w-4" />Ajouter un departement</Button>}{renderTable("STRUCTURE", departements)}</TabsContent>}
          {canRead("POSTE") && <TabsContent value="postes">{canWrite("POSTE") && <Button variant="outline" className="mb-2" onClick={() => openForm("POSTE")}><Briefcase className="mr-2 h-4 w-4" />Ajouter un poste</Button>}{renderTable("POSTE", postes)}</TabsContent>}
          {canRead("FONCTION") && <TabsContent value="fonctions">{canWrite("FONCTION") && <Button variant="outline" className="mb-2" onClick={() => openForm("FONCTION")}><FileText className="mr-2 h-4 w-4" />Ajouter une fonction</Button>}{renderTable("FONCTION", fonctions)}</TabsContent>}
          {canRead("GRADE") && <TabsContent value="grades">{canWrite("GRADE") && <Button variant="outline" className="mb-2" onClick={() => openForm("GRADE")}><Award className="mr-2 h-4 w-4" />Ajouter un grade</Button>}{renderTable("GRADE", grades)}</TabsContent>}
          {canRead("AFFECTATION") && <TabsContent value="affectations">{canWrite("AFFECTATION") && <Button variant="outline" className="mb-2" onClick={() => openForm("AFFECTATION")}><Users className="mr-2 h-4 w-4" />Nouvelle affectation</Button>}{renderTable("AFFECTATION", affectations)}</TabsContent>}
        </Tabs>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeForm === "SITE" && (editingItem ? "Modifier un site" : "Ajouter un site")}
              {activeForm === "DIRECTION" && (editingItem ? "Modifier une direction" : "Ajouter une direction")}
              {activeForm === "STRUCTURE" && (editingItem ? "Modifier un departement" : "Ajouter un departement")}
              {activeForm === "POSTE" && (editingItem ? "Modifier un poste" : "Ajouter un poste")}
              {activeForm === "FONCTION" && (editingItem ? "Modifier une fonction" : "Ajouter une fonction")}
              {activeForm === "GRADE" && (editingItem ? "Modifier un grade" : "Ajouter un grade")}
              {activeForm === "AFFECTATION" && (editingItem ? "Modifier l'affectation" : "Nouvelle affectation")}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            {activeForm === "SITE" && (
              <>
                <Input placeholder="Nom" value={formData.nom || ""} onChange={(e) => setFormData((prev: any) => ({ ...prev, nom: e.target.value }))} />
                <Input placeholder="Ville" value={formData.ville || ""} onChange={(e) => setFormData((prev: any) => ({ ...prev, ville: e.target.value }))} />
                <Input placeholder="Adresse" value={formData.adresse || ""} onChange={(e) => setFormData((prev: any) => ({ ...prev, adresse: e.target.value }))} />
              </>
            )}
            {activeForm === "DIRECTION" && (
              <>
                <Input placeholder="Code" value={formData.code || ""} onChange={(e) => setFormData((prev: any) => ({ ...prev, code: e.target.value }))} />
                <Input placeholder="Libelle" value={formData.libelle || ""} onChange={(e) => setFormData((prev: any) => ({ ...prev, libelle: e.target.value }))} />
              </>
            )}
            {activeForm === "STRUCTURE" && (
              <>
                <Input placeholder="Code" value={formData.code || ""} onChange={(e) => setFormData((prev: any) => ({ ...prev, code: e.target.value }))} />
                <Input placeholder="Nom" value={formData.nom || ""} onChange={(e) => setFormData((prev: any) => ({ ...prev, nom: e.target.value }))} />
                <select className="w-full rounded border p-2" value={formData.directionId || ""} onChange={(e) => setFormData((prev: any) => ({ ...prev, directionId: e.target.value }))}>
                  <option value="">-- Selectionnez la direction --</option>
                  {directions.map((item) => <option key={item.id} value={item.id}>{item.libelle}</option>)}
                </select>
              </>
            )}
            {activeForm === "POSTE" && (
              <>
                <Input placeholder="Code" value={formData.code || ""} onChange={(e) => setFormData((prev: any) => ({ ...prev, code: e.target.value }))} />
                <Input placeholder="Libelle" value={formData.libelle || ""} onChange={(e) => setFormData((prev: any) => ({ ...prev, libelle: e.target.value }))} />
                <select className="w-full rounded border p-2" value={formData.departementId || ""} onChange={(e) => setFormData((prev: any) => ({ ...prev, departementId: e.target.value }))}>
                  <option value="">-- Selectionnez le departement --</option>
                  {departements.map((item) => <option key={item.id} value={item.id}>{item.nom}</option>)}
                </select>
              </>
            )}
            {activeForm === "FONCTION" && (
              <>
                <Input placeholder="Code" value={formData.code || ""} onChange={(e) => setFormData((prev: any) => ({ ...prev, code: e.target.value }))} />
                <Input placeholder="Libelle" value={formData.libelle || ""} onChange={(e) => setFormData((prev: any) => ({ ...prev, libelle: e.target.value }))} />
                <select className="w-full rounded border p-2" value={formData.posteId || ""} onChange={(e) => setFormData((prev: any) => ({ ...prev, posteId: e.target.value }))}>
                  <option value="">-- Selectionnez le poste --</option>
                  {postes.map((item) => <option key={item.id} value={item.id}>{item.libelle}</option>)}
                </select>
              </>
            )}
            {activeForm === "GRADE" && (
              <>
                <Input placeholder="Code" value={formData.code || ""} onChange={(e) => setFormData((prev: any) => ({ ...prev, code: e.target.value }))} />
                <Input placeholder="Libelle" value={formData.libelle || ""} onChange={(e) => setFormData((prev: any) => ({ ...prev, libelle: e.target.value }))} />
                <Input placeholder="Indice salarial" type="number" value={formData.indiceSalarial || ""} onChange={(e) => setFormData((prev: any) => ({ ...prev, indiceSalarial: e.target.value }))} />
              </>
            )}
            {activeForm === "AFFECTATION" && (
              <div className="flex flex-col gap-3">
                <Select options={agentOptions} value={agentOptions.find((item) => item.value === Number(formData.agentId)) ?? null} onChange={(option: any) => setFormData((prev: any) => ({ ...prev, agentId: option?.value ?? "" }))} placeholder="Selectionnez un agent" isClearable {...selectThemeProps} />
                <Select options={option(postes, "libelle")} value={option(postes, "libelle").find((item) => item.value === Number(formData.posteId)) ?? null} onChange={(option: any) => setFormData((prev: any) => ({ ...prev, posteId: option?.value ?? "" }))} placeholder="Selectionnez le poste" isClearable {...selectThemeProps} />
                <Select options={option(fonctions, "libelle")} value={option(fonctions, "libelle").find((item) => item.value === Number(formData.fonctionId)) ?? null} onChange={(option: any) => setFormData((prev: any) => ({ ...prev, fonctionId: option?.value ?? "" }))} placeholder="Selectionnez la fonction" isClearable {...selectThemeProps} />
                <Select options={option(grades, "libelle")} value={option(grades, "libelle").find((item) => item.value === Number(formData.gradeId)) ?? null} onChange={(option: any) => setFormData((prev: any) => ({ ...prev, gradeId: option?.value ?? "" }))} placeholder="Selectionnez le grade" isClearable {...selectThemeProps} />
                <Select options={option(directions, "libelle")} value={option(directions, "libelle").find((item) => item.value === Number(formData.directionId)) ?? null} onChange={(option: any) => setFormData((prev: any) => ({ ...prev, directionId: option?.value ?? "" }))} placeholder="Selectionnez la direction" isClearable {...selectThemeProps} />
                <Select options={option(departements, "nom")} value={option(departements, "nom").find((item) => item.value === Number(formData.departementId)) ?? null} onChange={(option: any) => setFormData((prev: any) => ({ ...prev, departementId: option?.value ?? "" }))} placeholder="Selectionnez le departement" isClearable {...selectThemeProps} />
                <Select options={option(sites, "nom")} value={option(sites, "nom").find((item) => item.value === Number(formData.siteId)) ?? null} onChange={(option: any) => setFormData((prev: any) => ({ ...prev, siteId: option?.value ?? "" }))} placeholder="Selectionnez le site" isClearable {...selectThemeProps} />
                <Input type="date" value={formData.dateDebut || ""} onChange={(e) => setFormData((prev: any) => ({ ...prev, dateDebut: e.target.value }))} />
                <Input placeholder="Motif" value={formData.motif || ""} onChange={(e) => setFormData((prev: any) => ({ ...prev, motif: e.target.value }))} />
                <select className="w-full rounded border p-2" value={formData.type || ""} onChange={(e) => setFormData((prev: any) => ({ ...prev, type: e.target.value }))}>
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
              </div>
            )}

            <Button type="submit" className="w-full">{editingItem ? "Modifier" : "Enregistrer"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>Etes-vous sur de vouloir supprimer cet element ? Cette action est irreversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
