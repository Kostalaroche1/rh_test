import { agentRepository } from "@/repositories/agentRepository"


export async function modifierAgent(
    id: number,
    data: {
        nom?: string
        prenom?: string
        statut?: string
        dateEntree?: Date
        actif?: boolean
    }
) {
    return agentRepository.update(id, data)
}
