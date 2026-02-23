import prisma from "@/lib/prisma"


export const utilisateurRoleRepository = {
    assign(
        utilisateurId: number,
        roleId: number,
        attribuePar: number
    ) {
        return prisma.utilisateurRole.create({
            data: {
                utilisateurId,
                roleId,
                attribuePar
            }
        })
    },

    remove(utilisateurId: number, roleId: number) {
        return prisma.utilisateurRole.delete({
            where: {
                utilisateurId_roleId: {
                    utilisateurId,
                    roleId
                }
            }
        })
    },

    findByUtilisateur(utilisateurId: number) {
        return prisma.utilisateurRole.findMany({
            where: { utilisateurId },
            include: { role: true }
        })
    }
}
