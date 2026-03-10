import { compteAgentRepository } from "../../../../repositories/compteAgentRepository"

export async function delierCompte(compteAgentId: number) {
    return compteAgentRepository.unlink(compteAgentId)
}
