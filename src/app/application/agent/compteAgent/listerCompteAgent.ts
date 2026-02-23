import { compteAgentRepository } from "../../../repositories/compteAgentRepository"

export async function listerComptesAgent() {
    return compteAgentRepository.findAll()
}
