import { agentRepository } from "@/repositories/agentRepository";


export async function listerAgents() {
    const all = await agentRepository.findAll();
    return all
}
