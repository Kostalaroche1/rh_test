"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { GetRole } from "@/app/action/role/action"

type Role = "ADMIN" | "SUPERVISEUR" | "AGENT"

type Agent = {
  id: number
  matricule: string
  nom: string
  prenom: string
  email: string
  role: Role
  hasAccount: boolean
}
type Roles = {
  id: number
  nom :string,
  description:string,
  actif:number
}

type Props = {
  agent: Agent
  currentUserRole: Role // rôle de l'utilisateur connecté
}

export function CreateUserAccount({ agent, currentUserRole , open , setOpen }: any) {
  const [loading, setLoading] = useState(false)
const [role, setRole] = useState<Roles[]>([])
  // const [role, setRole] = useState<Role>(agent.role)
    useEffect(() => {
  GetRoles()
}, [])

const GetRoles = async () => {
  try {
    setLoading(true)
    const result = await GetRole()
    // console.log(result)
    setRole(result.data)
  } catch (e) {
    console.error(e)
  } finally {
    setLoading(false)
  }
}

  const canCreate =
    currentUserRole === "ADMIN" && agent?.compteAgent === false 

  const handleCreateAccount = async () => {
    try {
      setLoading(true)
      toast.success(
        `Compte créé pour ${agent?.prenom} ${agent?.nom}`
      )
// fermer le dialog après un court délai
setTimeout(() => setOpen(false), 500)

      setOpen(false)
    } catch (error) {
      toast.error("Erreur lors de la création du compte")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        disabled={!canCreate}
        onClick={() => setOpen(true)}
      >
        {agent?.compteAgent ? "Compte existant" : "Créer un compte"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}
  onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Créer un compte utilisateur</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Agent</Label>
              <p className="text-sm text-muted-foreground">
                {agent?.prenom} {agent?.nom} ({agent?.matricule})
              </p>
            </div>

            <div className="space-y-1">
              <Label>Email</Label>
              <p className="text-sm">{agent?.email}</p>
            </div>

            <div className="space-y-1">
              <Label>Rôle du compte</Label>
              <Select >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {role.map(r=>(
                  <SelectItem key={r.id} value={""+r.id}>{r.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label>Statut</Label>
              <Badge variant="secondary">ACTIF</Badge>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleCreateAccount}
              disabled={loading}
            >
              {loading ? "Création..." : "Créer le compte"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
