import { utilisateurRoleRepository } from "@/repositories/utilisateurRoleRepository";

export async function retirerRole(utilisateurId: number, roleId: number) {
    return utilisateurRoleRepository.remove(utilisateurId, roleId)
}
