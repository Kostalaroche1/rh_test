import { agentRepository } from "@/repositories/agentRepository";

export async function desactiverAgent(id: number) {
    return agentRepository.update(id, { actif: false })
}
