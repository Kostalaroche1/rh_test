"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
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
import { toast } from "sonner"
import { PencilIcon } from "lucide-react"
import { GetRole } from "@/app/action/role/action"
import { Roles } from "@/utilities/type"
import { AddAgentWithAccount, updateAgent } from "@/app/action/agent/action"
import { useAuth } from "@/app/contexts/auth/context"
import { hasAllPermissions } from "@/security/permissions"

type Props = {
  data: any
  open: any,
  setOpen: any
}

export function ModifierAgentCompte({ data, open, setOpen }: Props) {
  const { auth }: any = useAuth()
  // const [open, setOpen] = useState(false)
  const [createAccount, setCreateAccount] = useState(true)
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    matricule: data.matricule,
    nom: data.nom,
    prenom: data.prenom,
    statut: data.statut,
    password: data.password,
    roleId: data.roleId,
    role: data.role || "",
    agentId: data.agentId,
    utilisateurId: data.utilisateurId,
    email: data.login
  })

  if (!hasAllPermissions(auth, ["agent.update", "user.update"])) return null
  const close = () => setOpen(false)

  const handleSubmit = async () => {
    try {
      setLoading(true)

      // 🔁 Simulation backend
      await new Promise((r) => setTimeout(r, 1200))

      const compteAgent = updateAgent(form)
     toast.success(
  createAccount
    ? "Agent et compte créés avec succès"
    : "Agent créé sans compte"
)
// fermer le dialog après un court délai
setTimeout(() => setOpen(false), 500)

      setForm({
        matricule: "",
        nom: "",
        prenom: "",
        email: "",
        password: "",
        statut: "",
        roleId: "",
        agentId: "",
        role: "",
        utilisateurId: ""
      })
    } catch {
      toast.error("Erreur lors de la création")
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
        <Button onClick={getRole}>Modifier un agent</Button>
      </DialogTrigger>

      <DialogContent onPointerDownOutside={(e) => e.preventDefault()}
  onEscapeKeyDown={(e) => e.preventDefault()} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Modification agent</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Nom */}
            <div className="grid gap-2">
              <Label htmlFor="agent-edit-nom">Nom</Label>
              <div className="relative border-2 rounded-full">
                <Input
                  id="agent-edit-nom"
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
              <Label htmlFor="agent-edit-prenom">Pr??nom</Label>
              <div className="relative border-2 rounded-full">
                <Input
                  id="agent-edit-prenom"
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

            {/* Email */}
            {/* <div className="relative border-2 rounded-full col-span-2">
              <Input
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
            </div> */}

            {/* Password */}
            {/* <div className="relative border-2 rounded-full col-span-2">
              <Input
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
            </div> */}

            {/* Role Select */}
            <div className="grid gap-2 col-span-2">
              <Label htmlFor="agent-edit-role">R??le</Label>
              <div className="relative border-2 rounded-full col-span-2">
                <Select onValueChange={(value) => setForm({ ...form, roleId: value })}>
                  <SelectTrigger id="agent-edit-role" className="w-full">
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
                <Label htmlFor="agent-edit-statut">??tat civil</Label>
                <div className="relative border-2 rounded-full col-span-2">
                  <Select
                    onValueChange={(value) => setForm({ ...form, statut: value })}>
                    <SelectTrigger id="agent-edit-statut" className="w-full">
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
           <DialogClose asChild>
              <Button type="button" disabled={loading} onClick={close} variant="outline">
                Annuler
              </Button>
            </DialogClose>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Création..." : "Créer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
