import prisma from "@/lib/prisma"


export const compteAgentRepository = {
    link(
        agentId: number,
        utilisateurId: number,
        liePar: number
    ) {
        return prisma.compteAgent.create({
            data: {
                agentId,
                utilisateurId,
                liePar
            }
        })
    },

    unlink(compteAgentId: number) {
        return prisma.compteAgent.delete({
            where: { id: compteAgentId }
        })
    },

    findAll() {
        return prisma.compteAgent.findMany({
            include: {
                agent: true,
                utilisateur: true
            }
        })
    },

    findByAgent(agentId: number) {
        return prisma.compteAgent.findUnique({
            where: { agentId }
        })
    }
}
