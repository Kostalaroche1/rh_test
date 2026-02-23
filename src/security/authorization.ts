// authorization is role based access control (rbac) that mean each user could access in app if is have a role
//authorize in other access control

import { utilisateurRepository } from "@/repositories/utilisateurRepository"
import { getAuthenticatedUser } from "./auth"

export async function requireRole(rolesAutorises: string[]) {
    const auth = await getAuthenticatedUser()
    if (!auth) throw new Error("Non authentifié")

    const user = await utilisateurRepository.findById(auth.userId)
    const roles = user?.roles.map((r: { role: { nom: any } }) => r.role.nom) ?? []

    const ok = rolesAutorises.some(r => roles.includes(r))
    if (!ok) throw new Error("Accès interdit")

    return user
}
