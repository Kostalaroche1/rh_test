import { utilisateurRepository } from "@/repositories/utilisateurRepository"


export async function activerUtilisateur(id: number) {
    return utilisateurRepository.update(id, { actif: true })
}

export async function desactiverUtilisateur(id: number) {
    return utilisateurRepository.update(id, { actif: false })
}
