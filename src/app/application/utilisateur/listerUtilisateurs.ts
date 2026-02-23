import { utilisateurRepository } from "@/repositories/utilisateurRepository";

export async function listerUtilisateurs() {
    return utilisateurRepository.findAll()
}
