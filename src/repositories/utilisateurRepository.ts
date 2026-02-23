import prisma from "@/lib/prisma"
export const utilisateurRepository = {
    create(data: {
        login: string
        motDePasse: string
      
    }) {
        return prisma.utilisateur.create({ data })
    },

    findAll() {
        return prisma.utilisateur.findMany({
            include: {
                roles: { include: { role: true } },
                compteAgent : {

                    select:{
                        id : true,
                        utilisateur : true,
                        agent : {
                            select:{
                                matricule:true,
                                id : true,
                                nom:true,
                                prenom:true,
                                statut:true,
                                genre : true,
                                actif : true
                            }
                        }
                    }
                }
            }
        })
    },

    findById(id: number) {
        return prisma.utilisateur.findUnique({
            where: { id },
            include: {
                compteAgent : {
                    select : {
                        id : true,
                        agent : {
                            select : {
                                id : true,
                                matricule : true,
                                nom:true,
                                prenom:true,
                                statut : true,
                                actif : true
                            }
                        }
                    }
                },
                roles: { include: { role: true } },
            }
        })
    },

    update(
        id: number,
        data: {
            login?: string
            motDePasse?: string
            actif?: boolean
        }
    ) {
        return prisma.utilisateur.update({
            where: { id },
            data
        })
    }
}
