import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SubmitEventHandler } from 'react';
import Select from 'react-select'
export function DialogForm({handleSubmit , agents , handleChange , postes , fonctions , grades , directions , departements , sites , formData , activeForm , openDialog , setOpenDialog} : 
    {handleSubmit : SubmitEventHandler<HTMLFormElement> , agents : any , handleChange : any, postes : any, fonctions : any, grades : any, directions : any, departements : any, sites : any, formData : any , activeForm : any , openDialog : any , setOpenDialog : any}
){
    return (
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
                  {directions.map((d :any)=> (
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
                  {departements.map((dep:any) => (
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
                  {postes.map((p : any) => <option key={p.id} value={p.id}>{p.libelle}</option>)}
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
                <Select
                  options={agents.map((a: { compteAgent: { agent: { id: any; matricule: any } } }) => ({ value: a?.compteAgent?.agent.id, label: a?.compteAgent?.agent.matricule }))}
                  value={agents.find((a: { compteAgent: { agent: { id: any } } }) => a?.compteAgent?.agent.id === formData.agentId) ? { value: formData.agentId, label: agents.find((a: { compteAgent: { agent: { id: any; }; }; }) => a?.compteAgent?.agent.id === formData.agentId)?.compteAgent.agent.matricule } : null}
                  onChange={opt => handleChange("agentId", opt?.value)}
                  placeholder="-- Sélectionnez un agent --"
                  isClearable
                />
                {/* Poste */}
                <Select
                  options={postes.map((p: { id: any; libelle: any; }) => ({ value: p.id, label: p.libelle }))}
                  value={postes.find((p: { id: any; }) => p.id === formData.posteId) ? { value: formData.posteId, label: postes.find((p: { id: any; }) => p.id === formData.posteId)?.libelle } : null}
                  onChange={opt => handleChange("posteId", opt?.value)}
                  placeholder="-- Sélectionnez le poste --"
                  isClearable
                />
                {/* Fonction */}
                <Select
                  options={fonctions.map((f: { id: any; libelle: any; }) => ({ value: f.id, label: f.libelle }))}
                  value={fonctions.find((f: { id: any; }) => f.id === formData.fonctionId) ? { value: formData.fonctionId, label: fonctions.find((f: { id: any; }) => f.id === formData.fonctionId)?.libelle } : null}
                  onChange={opt => handleChange("fonctionId", opt?.value)}
                  placeholder="-- Sélectionnez la fonction --"
                  isClearable
                />
                {/* Grade */}
                <Select
                  options={grades.map((g: { id: any; libelle: any; }) => ({ value: g.id, label: g.libelle }))}
                  value={grades.find((g: { id: any; }) => g.id === formData.gradeId) ? { value: formData.gradeId, label: grades.find((g: { id: any; }) => g.id === formData.gradeId)?.libelle } : null}
                  onChange={opt => handleChange("gradeId", opt?.value)}
                  placeholder="-- Sélectionnez le grade --"
                  isClearable
                />
                {/* Direction */}
                <Select
                  options={directions.map((d: { id: any; libelle: any; }) => ({ value: d.id, label: d.libelle }))}
                  value={directions.find((d: { id: any; }) => d.id === formData.directionId) ? { value: formData.directionId, label: directions.find((d: { id: any; }) => d.id === formData.directionId)?.libelle } : null}
                  onChange={opt => handleChange("directionId", opt?.value)}
                  placeholder="-- Sélectionnez la direction --"
                  isClearable
                />
                {/* Département */}
                <Select
                  options={departements.map((dep: { id: any; nom: any; }) => ({ value: dep.id, label: dep.nom }))}
                  value={departements.find((dep: { id: any; }) => dep.id === formData.departementId) ? { value: formData.departementId, label: departements.find((dep: { id: any; }) => dep.id === formData.departementId)?.nom } : null}
                  onChange={opt => handleChange("departementId", opt?.value)}
                  placeholder="-- Sélectionnez le département --"
                  isClearable
                />
                {/* Site */}
                <Select
                  options={sites.map((s: { id: any; nom: any; }) => ({ value: s.id, label: s.nom }))}
                  value={sites.find((s: { id: any; }) => s.id === formData.siteId) ? { value: formData.siteId, label: sites.find((s: { id: any; }) => s.id === formData.siteId)?.nom } : null}
                  onChange={opt => handleChange("siteId", opt?.value)}
                  placeholder="-- Sélectionnez le site --"
                  isClearable
                />
                {/* Dates */}
                <input type="date" value={formData.dateDebut || ""} onChange={e => handleChange("dateDebut", e.target.value)} />
                <input type="date" value={formData.dateFin || ""} onChange={e => handleChange("dateFin", e.target.value)} />
                {/* Motif */}
                <Input placeholder="Motif" value={formData.motif || ""} onChange={e => handleChange("motif", e.target.value)} />
                {/* Type */}
                <Input placeholder="Type" value={formData.type || ""} onChange={e => handleChange("type", e.target.value)} />
              </div>
            )}

            <Button type="submit" className="w-full">{formData.id ? "Modifier" : "Enregistrer"}</Button>
          </form>
        </DialogContent>
      </Dialog>
    )
}