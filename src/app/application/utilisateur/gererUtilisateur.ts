import { utilisateurRepository } from "@/repositories/utilisateurRepository"
import { utilisateurRoleRepository } from "@/repositories/utilisateurRoleRepository"



export async function creerUtilisateur(
    login: string,
    motDePasse: string,
    roleId: number,
    creePar: number
) {
    const user = await utilisateurRepository.create({ login, motDePasse })

    // règle Sprint 1 : au moins 1 rôle à la création
    await utilisateurRoleRepository.assign(user.id, roleId, creePar)

    return user
}

// activer utilisateur
export async function activerUtilisateur(id: number) {
    return utilisateurRepository.update(id, { actif: true })
}
// desactiver user

export async function desactiverUtilisateur(id: number) {
    return utilisateurRepository.update(id, { actif: false })
}

// lister utilisateur

export async function listerUtilisateurs() {
    return utilisateurRepository.findAll()
}

// modier utilisateur

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
