'use client'

import Select, { SingleValue } from 'react-select'
import { useState } from "react"
import {
  Card, CardHeader, CardTitle, CardContent
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Table, TableHeader, TableBody, TableRow,
  TableCell, TableHead
} from "@/components/ui/table"
import {
  Tabs, TabsList, TabsTrigger, TabsContent
} from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { PlusCircle, MapPin, Building, Users, Layers, Briefcase, FileText, Calendar, User, Award } from "lucide-react"
import { toast } from 'sonner'

import { useGet, usePost } from "@/hooks/useApi"
import {
  CreateDepartement, CreateDirection, CreateFonction, CreateGrade, CreatePoste, CreateSite,
  GetDepartements, GetDirections, GetFonctions, GetGrades, GetPostes, GetSites,
  DeleteDepartement, DeleteDirection, DeleteFonction, DeleteGrade, DeletePoste, DeleteSite,
  UpdateSite,
  UpdateDirection,
  UpdateDepartement,
  UpdatePoste,
  UpdateFonction,
  UpdateGrade
} from "@/app/action/organisation/action"
import { CreateAffectation, GetAffectations, DeleteAffectation, UpdateAffectation } from "@/app/action/affectations/action"
import { GetAgent } from "@/app/action/agent/getAgent/action"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from '@/components/ui/label'
import { appReactSelectStyles } from "@/components/ui/react-select-theme"

export type ActiveForm =
  | "SITE" | "DIRECTION" | "STRUCTURE" | "AFFECTATION"
  | "POSTE" | "FONCTION" | "GRADE"
  | null

export default function OrganisationDashboard() {
  const selectThemeProps = {
    styles: appReactSelectStyles,
  }

  const [openDialog, setOpenDialog] = useState(false)
  const [activeForm, setActiveForm] = useState<ActiveForm>(null)
  const [formData, setFormData] = useState<any>({})

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: ActiveForm } | null>(null)

const openForm = (types: any, item?: any) => {
  setActiveForm(types)
  setEditingItem(item || null)
  setFormData(item || {})  // pré-remplit le formulaire si modification
  setOpenDialog(true)
}


  const handleChange = (key: string, value: string) => {
    const intValue = !isNaN(Number(value)) && value !== '' ? parseInt(value, 10) : value;
    setFormData((prev: any) => ({ ...prev, [key]: intValue }));
  };

  /* ========================= GET DATA ========================= */
  const { data: sitesRaw = [], refetch: refetchSites } = useGet(['sites'], GetSites)
  const { data: directionsRaw = [], refetch: refetchDirections } = useGet(['directions'], GetDirections)
  const { data: departementsRaw = [], refetch: refetchDepartements } = useGet(['departements'], GetDepartements)
  const { data: affectationsRaw = [], refetch: refetchAffectations } = useGet(['affectations'], GetAffectations)
  const { data: agentsRaw = [] } = useGet(['agents'], GetAgent)
  const { data: postesRaw = [], refetch: refetchPostes } = useGet(['postes'], GetPostes)
  const { data: fonctionsRaw = [], refetch: refetchFonctions } = useGet(['fonctions'], GetFonctions)
  const { data: gradesRaw = [], refetch: refetchGrades } = useGet(['grades'], GetGrades)
  const sites = Array.isArray(sitesRaw) ? (sitesRaw as any[]) : []
  const directions = Array.isArray(directionsRaw) ? (directionsRaw as any[]) : []
  const departements = Array.isArray(departementsRaw) ? (departementsRaw as any[]) : []
  const affectations = Array.isArray(affectationsRaw) ? (affectationsRaw as any[]) : []
  const agents = Array.isArray(agentsRaw) ? (agentsRaw as any[]) : []
  const postes = Array.isArray(postesRaw) ? (postesRaw as any[]) : []
  const fonctions = Array.isArray(fonctionsRaw) ? (fonctionsRaw as any[]) : []
  const grades = Array.isArray(gradesRaw) ? (gradesRaw as any[]) : []

  /* ========================= MUTATIONS ========================= */
  const { mutateAsync: createSite } = usePost(CreateSite)
  const { mutateAsync: createDirection } = usePost(CreateDirection)
  const { mutateAsync: createDepartement } = usePost(CreateDepartement)
  const { mutateAsync: createAffectation } = usePost(CreateAffectation)
  const { mutateAsync: createPoste } = usePost(CreatePoste)
  const { mutateAsync: createFonction } = usePost(CreateFonction)
  const { mutateAsync: createGrade } = usePost(CreateGrade)
  const [editingItem, setEditingItem] = useState<any>(null)


  /* ========================= HANDLE SUBMIT ========================= */
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  if (formData.dateDebut && formData.dateFin) {
    const debut = new Date(formData.dateDebut)
    const fin = new Date(formData.dateFin)
    if (debut > fin) {
      toast.warning("La date de début ne peut pas être supérieure à la date de fin !")
      return
    }
  }
console.log(formData , "form all")
  try {
    switch (activeForm) {
      case "SITE":
        editingItem 
          ? await UpdateSite({ ...formData, id: editingItem.id }) 
          : await CreateSite(formData)
        refetchSites()
        break
      case "DIRECTION":
        editingItem 
          ? await UpdateDirection({ ...formData, id: editingItem.id }) 
          : await CreateDirection(formData)
        refetchDirections()
        break
      case "STRUCTURE":
        editingItem 
          ? await UpdateDepartement({ ...formData, id: editingItem.id }) 
          : await CreateDepartement(formData)
        refetchDepartements()
        break
      case "POSTE":
        editingItem 
          ? await UpdatePoste({ ...formData, id: editingItem.id }) 
          : await CreatePoste(formData)
        refetchPostes()
        break
      case "FONCTION":
        editingItem 
          ? await UpdateFonction({ ...formData, id: editingItem.id }) 
          : await CreateFonction(formData)
        refetchFonctions()
        break
      case "GRADE":
        editingItem 
          ? await UpdateGrade({ ...formData, id: editingItem.id }) 
          : await CreateGrade(formData)
        refetchGrades()
        break
      case "AFFECTATION":
        formData.id =editingItem? editingItem.id : formData.id
        editingItem 
          ? await UpdateAffectation(formData) 
          : await CreateAffectation(formData)
        refetchAffectations()
        break
    }

    toast.info(`${activeForm} ${editingItem ? "modifié" : "enregistré"} avec succès !`)
    setOpenDialog(false)
    setFormData({})
    setEditingItem(null)
  } catch (error) {
    console.error(error)
  }
}



  /* ========================= DELETE ========================= */
  const confirmDelete = (id: string, type: ActiveForm) => {
    setItemToDelete({ id, type })
    setOpenDeleteDialog(true)
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    const { id, type } = itemToDelete
    try {
      switch(type) {
        case "SITE": await DeleteSite(id); refetchSites(); break
        case "DIRECTION": await DeleteDirection(id); refetchDirections(); break
        case "STRUCTURE": await DeleteDepartement(id); refetchDepartements(); break
        case "POSTE": await DeletePoste(id); refetchPostes(); break
        case "FONCTION": await DeleteFonction(id); refetchFonctions(); break
        case "GRADE": await DeleteGrade(id); refetchGrades(); break
        case "AFFECTATION": await DeleteAffectation(id); refetchAffectations(); break
      }
      toast.success(`${type} supprimé avec succès !`)
    } catch (error) {
      console.error(error)
      toast.error("Erreur lors de la suppression !")
    } finally {
      setOpenDeleteDialog(false)
      setItemToDelete(null)
    }
  }

  /* ========================= RENDER TAB CONTENT ========================= */
  const renderTable = (data: any[], type: ActiveForm) => (
    <Card>
      <CardHeader><CardTitle>{type}</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {type === "SITE" && <>
                <TableHead>Nom</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Adresse</TableHead>
              </>}
              {type === "DIRECTION" && <>
                <TableHead>Code</TableHead>
                <TableHead>Libellé</TableHead>
              </>}
              {type === "STRUCTURE" && <>
                <TableHead>Code</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Direction</TableHead>
              </>}
              {type === "POSTE" && <>
                <TableHead>Code</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Département</TableHead>
              </>}
              {type === "FONCTION" && <>
                <TableHead>Code</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Poste</TableHead>
              </>}
              {type === "GRADE" && <>
                <TableHead>Code</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead>Indice</TableHead>
              </>}
              {type === "AFFECTATION" && <>
                <TableHead>Agent</TableHead>
                <TableHead>Poste</TableHead>
                <TableHead>Fonction</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Direction</TableHead>
              </>}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item: any) => (
              <TableRow key={item.id}>
                {type === "SITE" && <>
                  <TableCell>{item.nom}</TableCell>
                  <TableCell>{item.ville}</TableCell>
                  <TableCell>{item.adresse}</TableCell>
                </>}
                {type === "DIRECTION" && <>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.libelle}</TableCell>
                </>}
                {type === "STRUCTURE" && <>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.nom}</TableCell>
                  <TableCell>{item.direction?.libelle}</TableCell>
                </>}
                {type === "POSTE" && <>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.libelle}</TableCell>
                  <TableCell>{item.departement?.nom}</TableCell>
                </>}
                {type === "FONCTION" && <>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.libelle}</TableCell>
                  <TableCell>{item.poste?.libelle}</TableCell>
                </>}
                {type === "GRADE" && <>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.libelle}</TableCell>
                  <TableCell>{item.indiceSalarial}</TableCell>
                </>}
                {type === "AFFECTATION" && <>
                  <TableCell>{item.agent?.matricule}</TableCell>
                  <TableCell>{item.poste?.libelle}</TableCell>
                  <TableCell>{item.fonction?.libelle}</TableCell>
                  <TableCell>{item.grade?.libelle}</TableCell>
                  <TableCell>{item.direction?.libelle}</TableCell>
                </>}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">Actions</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>

                    <DropdownMenuItem onClick={() => openForm(type, item)}>Modifier</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => confirmDelete(item.id, type)}>Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )

  return (
    <div className="erp-page">
      <div>
        <h1 className="text-3xl font-bold">Espace Organisation</h1>
        <p className="text-muted-foreground">Gestion complète : sites, directions, structures, postes, fonctions, grades, affectations</p>
      </div>

      <Separator />

      <Tabs defaultValue="sites">
        <TabsList className="flex-wrap gap-2">
          <TabsTrigger value="sites">Sites</TabsTrigger>
          <TabsTrigger value="directions">Directions</TabsTrigger>
          <TabsTrigger value="structure">services</TabsTrigger>
          <TabsTrigger value="postes">Postes</TabsTrigger>
          <TabsTrigger value="fonctions">Fonctions</TabsTrigger>
          <TabsTrigger value="grades">Grades</TabsTrigger>
          <TabsTrigger value="affectations">Affectations</TabsTrigger>
        </TabsList>

        <TabsContent value="sites"> <Button variant="outline" className='mb-2' onClick={() => openForm("SITE")}><MapPin className="mr-2" />Ajouter un site</Button>{renderTable(sites, "SITE")}</TabsContent>
        <TabsContent value="directions"><Button variant="outline" className='mb-2' onClick={() => openForm("DIRECTION")}><Building className="mr-2" />Ajouter une direction</Button>{renderTable(directions, "DIRECTION")}</TabsContent>
        <TabsContent value="structure"><Button variant="outline" className='mb-2' onClick={() => openForm("STRUCTURE")}><Layers className="mr-2" />Ajouter un département</Button>{renderTable(departements, "STRUCTURE")}</TabsContent>
        <TabsContent value="postes"><Button variant="outline" className='mb-2' onClick={() => openForm("POSTE")}><Briefcase className="mr-2" />Ajouter un poste</Button>{renderTable(postes, "POSTE")}</TabsContent>
        <TabsContent value="fonctions"><Button variant="outline" className='mb-2' onClick={() => openForm("FONCTION")}><FileText className="mr-2" />Ajouter une fonction</Button>{renderTable(fonctions, "FONCTION")}</TabsContent>
        <TabsContent value="grades"><Button variant="outline" className='mb-2' onClick={() => openForm("GRADE")}><FileText className="mr-2" />Ajouter un grade</Button>{renderTable(grades, "GRADE")}</TabsContent>
        <TabsContent value="affectations"><Button variant="outline" className='mb-2' onClick={() => openForm("AFFECTATION")}><Users className="mr-2" />Nouvelle affectation</Button>{renderTable(affectations, "AFFECTATION")}</TabsContent>
      </Tabs>

      {/* ================= DIALOG FORMULAIRE ================= */}
      {/* ================= DIALOG FORMULAIRE ================= */}
      <Dialog open={openDialog} onOpenChange={() => setOpenDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeForm === "SITE" && (formData.id ? "Modifier un site" : "Ajouter un site")}
              {activeForm === "DIRECTION" && (formData.id ? "Modifier une direction" : "Ajouter une direction")}
              {activeForm === "STRUCTURE" && (formData.id ? "Modifier un département" : "Ajouter un département")}
              {activeForm === "POSTE" && (formData.id ? "Modifier un poste" : "Ajouter un poste")}
              {activeForm === "FONCTION" && (formData.id ? "Modifier une fonction" : "Ajouter une fonction")}
              {activeForm === "GRADE" && (formData.id ? "Modifier un grade" : "Ajouter un grade")}
              {activeForm === "AFFECTATION" && (formData.id ? "Modifier l'affectation" : "Nouvelle affectation")}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            {activeForm === "SITE" && (
              <>
                <Input
                  placeholder="Nom"
                  value={formData.nom || ""}
                  onChange={e => handleChange("nom", e.target.value)}
                />
                <Input
                  placeholder="Ville"
                  value={formData.ville || ""}
                  onChange={e => handleChange("ville", e.target.value)}
                />
                <Input
                  placeholder="Adresse"
                  value={formData.adresse || ""}
                  onChange={e => handleChange("adresse", e.target.value)}
                />
              </>
            )}

            {activeForm === "DIRECTION" && (
              <>
                <Input
                  placeholder="Code"
                  value={formData.code || ""}
                  onChange={e => handleChange("code", e.target.value)}
                />
                <Input
                  placeholder="Libellé"
                  value={formData.libelle || ""}
                  onChange={e => handleChange("libelle", e.target.value)}
                />
              </>
            )}

            {activeForm === "STRUCTURE" && (
              <>
                <Input
                  placeholder="Code"
                  value={formData.code || ""}
                  onChange={e => handleChange("code", e.target.value)}
                />
                <Input
                  placeholder="Nom"
                  value={formData.nom || ""}
                  onChange={e => handleChange("nom", e.target.value)}
                />
                <select
                  value={formData.directionId || ""}
                  onChange={e => handleChange("directionId", e.target.value)}
                  className="border p-2 rounded"
                >
                  <option value="">-- Sélectionnez la direction --</option>
                  {directions.map(d => (
                    <option key={d.id} value={d.id}>{d.libelle}</option>
                  ))}
                </select>
              </>
            )}

            {activeForm === "POSTE" && (
              <>
                <Input
                  placeholder="Code"
                  value={formData.code || ""}
                  onChange={e => handleChange("code", e.target.value)}
                />
                <Input
                  placeholder="Libellé"
                  value={formData.libelle || ""}
                  onChange={e => handleChange("libelle", e.target.value)}
                />
                <select
                  value={formData.departementId || ""}
                  onChange={e => handleChange("departementId", e.target.value)}
                  className="border p-2 rounded"
                >
                  <option value="">-- Sélectionnez le département --</option>
                  {departements.map(dep => (
                    <option key={dep.id} value={dep.id}>{dep.nom}</option>
                  ))}
                </select>
              </>
            )}

            {activeForm === "FONCTION" && (
              <>
                <Input
                  placeholder="Code"
                  value={formData.code || ""}
                  onChange={e => handleChange("code", e.target.value)}
                />
                <Input
                  placeholder="Libellé"
                  value={formData.libelle || ""}
                  onChange={e => handleChange("libelle", e.target.value)}
                />
                <select
                  value={formData.posteId || ""}
                  onChange={e => handleChange("posteId", e.target.value)}
                  className="border p-2 rounded"
                >
                  <option value="">-- Sélectionnez le poste --</option>
                  {postes.map(p => <option key={p.id} value={p.id}>{p.libelle}</option>)}
                </select>
              </>
            )}

            {activeForm === "GRADE" && (
              <>
                <Input
                  placeholder="Code"
                  value={formData.code || ""}
                  onChange={e => handleChange("code", e.target.value)}
                />
                <Input
                  placeholder="Libellé"
                  value={formData.libelle || ""}
                  onChange={e => handleChange("libelle", e.target.value)}
                />
                <Input
                  placeholder="Indice salarial"
                  type="number"
                  value={formData.indiceSalarial || ""}
                  onChange={e => handleChange("indiceSalarial", e.target.value)}
                />
              </>
            )}

           
            {activeForm === "AFFECTATION" && (
  <div className="flex flex-col gap-3">
    {/* Agent */}
   {/* Agent */}
<Select
  options={agents.map(a => ({
    value: a.compteAgent.agent.id,
    label: a.compteAgent.agent.matricule,
    name: a.compteAgent.agent.nom + " " + a.compteAgent.agent.prenom
  }))}
  value={
    agents.find(a => a.compteAgent.agent.id === formData.agentId)
      ? {
          value: formData.agentId,
          label: agents.find(a => a.compteAgent.agent.id === formData.agentId)?.compteAgent.agent.matricule,
          name: agents.find(a => a.compteAgent.agent.id === formData.agentId)?.compteAgent.agent.nom + " " +
                agents.find(a => a.compteAgent.agent.id === formData.agentId)?.compteAgent.agent.prenom
        }
      : null
  }
  onChange={opt => handleChange("agentId", opt?.value)}
  placeholder="-- Sélectionnez un agent --"
  isClearable
      {...selectThemeProps}
  formatOptionLabel={(option: any) => (
    <div title={option.name} className="truncate">
      {option.label}
    </div>
  )}
  className="min-w-[200px]"
/>

    {/* Poste */}
    <Select
      options={postes.map(p => ({ value: p.id, label: p.libelle }))}
      value={postes.find(p => p.id === formData.posteId) ? { value: formData.posteId, label: postes.find(p => p.id === formData.posteId)?.libelle } : null}
      onChange={opt => handleChange("posteId", opt?.value)}
      placeholder="-- Sélectionnez le poste --"
      isClearable
      {...selectThemeProps}
    />
    {/* Fonction */}
    <Select
      options={fonctions.map(f => ({ value: f.id, label: f.libelle }))}
      value={fonctions.find(f => f.id === formData.fonctionId) ? { value: formData.fonctionId, label: fonctions.find(f => f.id === formData.fonctionId)?.libelle } : null}
      onChange={opt => handleChange("fonctionId", opt?.value)}
      placeholder="-- Sélectionnez la fonction --"
      isClearable
      {...selectThemeProps}
    />
    {/* Grade */}
    <Select
      options={grades.map(g => ({ value: g.id, label: g.libelle }))}
      value={grades.find(g => g.id === formData.gradeId) ? { value: formData.gradeId, label: grades.find(g => g.id === formData.gradeId)?.libelle } : null}
      onChange={opt => handleChange("gradeId", opt?.value)}
      placeholder="-- Sélectionnez le grade --"
      isClearable
      {...selectThemeProps}
    />
    {/* Direction */}
    <Select
      options={directions.map(d => ({ value: d.id, label: d.libelle }))}
      value={directions.find(d => d.id === formData.directionId) ? { value: formData.directionId, label: directions.find(d => d.id === formData.directionId)?.libelle } : null}
      onChange={opt => handleChange("directionId", opt?.value)}
      placeholder="-- Sélectionnez la direction --"
      isClearable
      {...selectThemeProps}
    />
    {/* Département */}
    <Select
      options={departements.map(dep => ({ value: dep.id, label: dep.nom }))}
      value={departements.find(dep => dep.id === formData.departementId) ? { value: formData.departementId, label: departements.find(dep => dep.id === formData.departementId)?.nom } : null}
      onChange={opt => handleChange("departementId", opt?.value)}
      placeholder="-- Sélectionnez le département --"
      isClearable
      {...selectThemeProps}
    />
    {/* Site */}
    <Select
      options={sites.map(s => ({ value: s.id, label: s.nom }))}
      value={sites.find(s => s.id === formData.siteId) ? { value: formData.siteId, label: sites.find(s => s.id === formData.siteId)?.nom } : null}
      onChange={opt => handleChange("siteId", opt?.value)}
      placeholder="-- Sélectionnez le site --"
      isClearable
      {...selectThemeProps}
    />
    {/* Date début */}
    <label htmlFor="dates"> Date debut</label>
    <input type="date" id='dates' value={formData.dateDebut || ""} onChange={e => handleChange("dateDebut", e.target.value)} />

    {/* Motif */}
    <Input placeholder="Motif" value={formData.motif || ""} onChange={e => handleChange("motif", e.target.value)} />

    {/* Type d'affectation */}
    <select
      value={formData.type || ""}
      onChange={e => handleChange("type", e.target.value)}
      className="border p-2 rounded"
    >
      <option value="">-- Sélectionnez le type d'affectation --</option>
      <option value="PROMOTION">Promotion</option>
      <option value="MUTATION">Mutation</option>
      <option value="NOMINATION">Nomination</option>
      <option value="AFFECTATION">Affectation</option>
      <option value="INTERIM">Intérim</option>
      <option value="REINTEGRATION">Réintégration</option>
      <option value="DETACHEMENT">Détachement</option>
      <option value="MONTEE_GRADE">Montée en grade</option>
      <option value="RETROGRADATION">Rétrogradation</option>
    </select>
  </div>
)}


            <Button type="submit" className="w-full">{formData.id ? "Modifier" : "Enregistrer"}</Button>
          </form>
        </DialogContent>
      </Dialog>


      {/* ================= ALERT DIALOG DELETE ================= */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
