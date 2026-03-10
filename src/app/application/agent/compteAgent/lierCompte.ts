import { compteAgentRepository } from "../../../../repositories/compteAgentRepository"

export async function lierCompte(
    agentId: number,
    utilisateurId: number,
    liePar: number
) {
    return compteAgentRepository.link(agentId, utilisateurId, liePar)
}
