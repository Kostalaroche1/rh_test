"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast, Toaster } from "sonner"
import { PencilIcon } from "lucide-react"
import { GetRole } from "@/app/action/role/action"
import { Roles } from "@/utilities/type"
import { AddAgentWithAccount } from "@/app/action/agent/action"
import { useAuth } from "@/app/contexts/auth/context"
import { hasAllPermissions } from "@/security/permissions"

type Props = {
  refetchAgWA: any
}

export function CreateAgentWithAccount({ refetchAgWA }: Props) {
  const { auth }: any = useAuth()
  const [open, setOpen] = useState(false)
  const [createAccount, setCreateAccount] = useState(true)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    matricule: "",
    nom: "",
    prenom: "",
    email: "",
    statut: "",
    genre : "",
    datenais : "",
    photo : "",
    password: "",
    roleId: " ",
    dataEntree : ""
  })
  const canCreate = hasAllPermissions(auth, ["agent.create", "user.create"])

  if (!canCreate) return null

  const handleSubmit = async () => {
    try {
      setLoading(true)

         // 🔌 Simulation API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const compteAgent : any = await AddAgentWithAccount(form)

      toast.success(
        compteAgent.message
      )
      refetchAgWA()
      setOpen(compteAgent.status ===200 ? false : true) 
      if(compteAgent.status !=200) return;
      setForm({
        matricule: "",
        nom: "",
        prenom: "",
        email: "",
        password: "",
        statut: "",
        genre : "",
        datenais : "",
        photo : "",
        roleId: "",
        dataEntree : ""
      })
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }
  const [roles, setRoles] = useState<Roles[]>([])
  const getRole = async () => {
    try {
      const responses = await GetRole()
      const result = await responses
      if (result.status === 200) {
        setRoles(result.data)
      }
    } catch (error) {
      toast.error("" + error)
    }
  }

  useEffect(() => {
    getRole()
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button onClick={getRole}>Créer un agent</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Créer un agent</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Nom */}
            <div className="grid gap-2">
              <Label htmlFor="agent-account-nom">Nom</Label>
              <div className="relative border-2 rounded-full">
                <Input
                  id="agent-account-nom"
                  placeholder="Nom"
                  disabled={loading}
                  className="
                      pl-10
                      border-0
                      shadow-none
                      focus:outline-none
                      focus:ring-0
                      focus-visible:ring-0
                      focus-visible:outline-none"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  required
                />
                <PencilIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              </div>
            </div>

            {/* Pr??nom */}
            <div className="grid gap-2">
              <Label htmlFor="agent-account-prenom">Pr??nom</Label>
              <div className="relative border-2 rounded-full">
                <Input
                  id="agent-account-prenom"
                  placeholder="Pr??nom"
                  disabled={loading}
                  className="
                      pl-10
                      border-0
                      shadow-none
                      focus:outline-none
                      focus:ring-0
                      focus-visible:ring-0
                      focus-visible:outline-none"
                  value={form.prenom}
                  onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                  required
                />
                <PencilIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              </div>
            </div>

            <div className="grid gap-2 col-span-2">
              <Label htmlFor="agent-account-genre">Genre</Label>
              <div className="relative border-2 rounded-full col-span-2">
                <Select
                  onValueChange={(value) => setForm({ ...form, genre: value })}
                >
                  <SelectTrigger id="agent-account-genre" className="w-full">
                    <SelectValue placeholder="genre?" />
                  </SelectTrigger>
                  <SelectContent>
                   <SelectItem value={"MASCULIN"}>Masculin</SelectItem>
                    <SelectItem value={"FEMININ"}>Feminin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2 col-span-2">
              <Label htmlFor="agent-account-datenais">  Date Naissances</Label>
              <div className="relative border-2 rounded-full col-span-2">
                <Input
                  id="agent-account-datenais"
                  placeholder="date Entree"
                  type="date"
                  disabled={loading}
                  className="
                      pl-10
                      border-0
                      shadow-none
                      focus:outline-none
                      focus:ring-0
                      focus-visible:ring-0
                      focus-visible:outline-none"
                  value={form.datenais}
                  onChange={(e) => setForm({ ...form, datenais: e.target.value })}
                  required
                />
                <PencilIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              </div>
            </div>

            <div className="grid gap-2 col-span-2">
              <Label htmlFor="agent-account-email">Email</Label>
              <div className="relative border-2 rounded-full col-span-2">
                <Input
                  id="agent-account-email"
                  type="email"
                  placeholder="email@example.com"
                  className="
                      pl-10
                      border-0
                      shadow-none
                      focus:outline-none
                      focus:ring-0
                      focus-visible:ring-0
                      focus-visible:outline-none"
                  disabled={loading}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <PencilIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              </div>
            </div>

            <div className="grid gap-2 col-span-2">
              <Label htmlFor="agent-account-password">Mot de passe</Label>
              <div className="relative border-2 rounded-full col-span-2">
                <Input
                  id="agent-account-password"
                  type="password"
                  placeholder="******"
                  className="
                      pl-10
                      border-0
                      shadow-none
                      focus:outline-none
                      focus:ring-0
                      focus-visible:ring-0
                      focus-visible:outline-none"
                  disabled={loading}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <PencilIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              </div>
            </div>
           
            <div className="grid gap-2 col-span-2">
              <Label htmlFor="agent-account-date-entree">  Date Entree</Label>
              <div className="relative border-2 rounded-full col-span-2">
                <Input
                  id="agent-account-date-entree"
                  placeholder="date Entree"
                  type="date"
                  disabled={loading}
                  className="
                      pl-10
                      border-0
                      shadow-none
                      focus:outline-none
                      focus:ring-0
                      focus-visible:ring-0
                      focus-visible:outline-none"
                  value={form.dataEntree}
                  onChange={(e) => setForm({ ...form, dataEntree: e.target.value })}
                  required
                />
                <PencilIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
              </div>
            </div>
            {/* Role Select */}
            <div className="grid gap-2 col-span-2">
              <Label htmlFor="agent-account-role">R??le</Label>
              <div className="relative border-2 rounded-full col-span-2">
                <Select
                  onValueChange={(value) => setForm({ ...form, roleId: value })}
                >
                  <SelectTrigger id="agent-account-role" className="w-full">
                    <SelectValue placeholder="Choisir un r??le" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.length > 0
                      ? roles.map((role) => (
                        <SelectItem value={"" + role.id} key={role.id}>
                          {role.nom}
                        </SelectItem>
                      ))
                      : <SelectItem value="null" disabled>Aucun r??le</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2 col-span-2">
              <Label htmlFor="agent-account-statut">??tat civil</Label>
              <div className="relative border-2 rounded-full col-span-2">
                  <Select
                    onValueChange={(value) => setForm({ ...form, statut: value })}
                  >
                    <SelectTrigger id="agent-account-statut" className="w-full">
                      <SelectValue placeholder="choisir etat civil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="C??libataire" >C??libataire</SelectItem>
                      <SelectItem value="Divorc??" >Divorc??</SelectItem>
                      <SelectItem value="Mari??" >Mari??</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Création..." : "Créer"}
          </Button>
        </DialogFooter>
         <Toaster/>
      </DialogContent>
    </Dialog>
  )
}
