'use client'
import React, { useState, ChangeEvent, FormEvent } from "react";
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
import { User } from "@/utilities/type";
import { generateMatricule } from "@/services/generateMat";
import { toast, Toaster } from "sonner";
import { AddUser } from "@/app/action/user/action";

export default function AddUserModale() {

 const [user, setUser] = React.useState<User>({
    id : "",
    login : "",
    motDePasse : ""
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setUser((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const [loading , setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // console.log("User sauvegardé :", User);
    const responses : any = await AddUser(user)
    const result = await responses.json();
      if(result.status === 200){
        toast.success(result.message);
        setOpen(false)
      }
       toast.success(result.message);
    console.log("User sauvegardé :", result);
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
        <Button variant="outline" onClick={() => setOpen(true)}>Add User</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]"
      onPointerDownOutside={(e) => e.preventDefault()}
  onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Création User</DialogTitle>
          <DialogDescription>
            Renseignez les informations de l’User puis sauvegardez.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="nom">email</Label>
              <Input
                id="nom"
                type="email"
                name="login"
                value={user.login}
                disabled={loading}
                onChange={handleChange}
                placeholder="Tapez le nom"
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="postnom">mot de passe</Label>
              <Input
                id="password"
                name="motDePasse"
                type="password"
                disabled={loading}
                value={user.motDePasse}
                onChange={handleChange}
                placeholder="Tapez le mot de passe"
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
