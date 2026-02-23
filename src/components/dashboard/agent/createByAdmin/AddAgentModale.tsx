'use client'
import { useState, ChangeEvent, FormEvent } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Agent } from "@/utilities/type";
import { AddAgent } from "@/app/action/agent/action";
import { generateMatricule } from "@/services/generateMat";
import { toast, Toaster } from "sonner";

export default function AddAgentModale() {
const [agent, setAgent] = useState<Agent>({
  id: "",
  matricule: "",
  nom: "",
  postnom: "",
  prenom: "",
  statut: "",
  genre :  "",
  actif: true,
  dateEntree: "",
  dateNaissance: "",
  etatCivil: "Célibataire",
});


  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setAgent((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const [loading , setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // console.log("Agent sauvegardé :", agent);
    const responses : any = await AddAgent(agent)
    const result = await responses.json();
      if(result.status === 200){
        toast.success(result.message);
        setOpen(false)
      }
       toast.success(result.message);
    console.log("Agent sauvegardé :", result);
    setLoading(false)
    } catch (error : any) {
       toast.success(error);
      setLoading(false)
    }

  };
  const [open , setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={() => setOpen(true)}>Add Agent</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]"
      onPointerDownOutside={(e) => e.preventDefault()}
  onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Création Agent</DialogTitle>
          <DialogDescription>
            Renseignez les informations de l’agent puis sauvegardez.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="nom">Nom</Label>
              <Input
                id="nom"
                name="nom"
                value={agent.nom}
                disabled={loading}
                onChange={handleChange}
                placeholder="Tapez le nom"
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="postnom">Postnom</Label>
              <Input
                id="postnom"
                name="postnom"
                disabled={loading}
                value={agent.postnom}
                onChange={handleChange}
                placeholder="Tapez le postnom"
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="prenom">Prénom</Label>
              <Input
                id="prenom"
                name="prenom"
                value={agent.prenom}
                disabled={loading}
                onChange={handleChange}
                placeholder="Tapez le prénom"
              />
            </div>
            <div className="grid gap-3">
  <Label>État civil</Label>
  <Select
    value={agent.statut}
    disabled={loading}
    onValueChange={(value) =>
      setAgent((prev) => ({
        ...prev,
        statut: value ,
      }))
    }
  >
    <SelectTrigger disabled={loading}>
      <SelectValue placeholder="Sélectionnez l’état civil" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="Célibataire">Célibataire</SelectItem>
      <SelectItem value="Marié(e)">Marié(e)</SelectItem>
      <SelectItem value="Divorcé(e)">Divorcé(e)</SelectItem>
      <SelectItem value="Veuf(ve)">Veuf(ve)</SelectItem>
    </SelectContent>
  </Select>
</div>
       <div className="grid gap-3">
  <Label>Genre</Label>
  <Select
    value={agent.statut}
    disabled={loading}
    onValueChange={(value) =>
      setAgent((prev) => ({
        ...prev,
        genre: value ,
      }))
    }
  >
    <SelectTrigger disabled={loading}>
      <SelectValue placeholder="Sélectionnez le Genre" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="MASCULIN">MASCULIN</SelectItem>
      <SelectItem value="FEMININ">FEMININ</SelectItem>
    </SelectContent>
  </Select>
</div>

            <div className="grid gap-3">
              <Label htmlFor="dateNaissance">Date de naissance</Label>
              <Input
                id="dateNaissance"
                type="date"
                disabled={loading}
                name="dateNaissance"
                value={agent.dateNaissance}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="dateEntree">Date d’entrée</Label>
              <Input
                id="dateEntree"
                type="date"
                disabled={loading}
                name="dateEntree"
                value={agent.dateEntree}
                onChange={handleChange}
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" disabled={loading} variant="outline">
                Annuler
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>Sauvegarder</Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <Toaster/>
    </Dialog>
  );
}
