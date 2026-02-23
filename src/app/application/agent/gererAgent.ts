import { agentRepository } from "@/repositories/agentRepository"


export async function creerAgent(data: {
    matricule: string
    nom: string
    prenom: string
    statut: string
    dateEntree: Date
}) {
    return agentRepository.create(data)
}


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



export async function desactiverAgent(id: number) {
    return agentRepository.update(id, { actif: false })
}


export async function listerAgents() {
    return agentRepository.findAll()
}

