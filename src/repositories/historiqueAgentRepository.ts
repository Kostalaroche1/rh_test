import prisma from "@/lib/prisma"


export const historiqueAgentRepository = {
    trace(data: {
        agentId: number
        champ: string
        ancienneValeur?: string
        nouvelleValeur?: string
    }) {
        return prisma.historiqueAgent.create({ data })
    },

    findByAgent(agentId: number) {
        return prisma.historiqueAgent.findMany({
            where: { agentId },
            orderBy: { date: "desc" }
        })
    }
}
