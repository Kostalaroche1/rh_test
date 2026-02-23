import prisma from "@/lib/prisma"
import { generateMatricule } from "@/services/generateMat"


export const agentRepository = {
    create(data: {
        nom: string
        prenom: string
        statut: string
        dateEntree: Date
    }) {
        return prisma.agent.create({
    data: {
      ...data,
      
      matricule: generateMatricule(),
    },
  });
    },

    findAll() {
        return prisma.utilisateur.findMany({
           select : {
            id : true,
            login:true,
            actif: true,
            roles : true,
            compteAgent : {
                select : {
                    agent: true,
                    agentId:true,
                    liePar : true,
                    utilisateurId:true,
                    id:true,
                    dateLiaison:true,
                }
            }
           }
        })
    },

    findById(id: number) {
        return prisma.agent.findUnique({
            where: { id },
            include: {
                compte: true,
                historique: true
            }
        })
    },

    update(
        id: number,
        data: {
            nom?: string
            prenom?: string
            statut?: string
            dateEntree?: Date
            actif?: boolean
        }
    ) {
        return prisma.agent.update({
            where: { id },
            data
        })
    }
}
