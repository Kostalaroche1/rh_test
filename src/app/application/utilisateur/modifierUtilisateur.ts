import { utilisateurRepository } from "@/repositories/utilisateurRepository"

export async function modifierUtilisateur(
    id: number,
    data: {
        login?: string
        motDePasse?: string
        actif?: boolean
    }
) {
    return utilisateurRepository.update(id, data)
}
