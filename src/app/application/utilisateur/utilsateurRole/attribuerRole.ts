import { utilisateurRoleRepository } from "@/repositories/utilisateurRoleRepository";

export async function attribuerRole(
    utilisateurId: number,
    roleId: number,
    attribuePar: number
) {
    return utilisateurRoleRepository.assign(utilisateurId, roleId, attribuePar)
}
