import { agentRepository } from "@/repositories/agentRepository"


export async function creerAgent(data: {
    matricule: string
    nom: string
    prenom: string
    statut: string
    dateEntree: Date
}) {
    return  await agentRepository.create(data)
}
