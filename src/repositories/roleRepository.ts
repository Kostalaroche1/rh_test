import prisma from "@/lib/prisma"


export const roleRepository = {
    create(data: {
        nom: string
        description?: string
    }) {
        return prisma.role.create({ data })
    },

    findAll() {
        return prisma.role.findMany()
    },

    findById(id: number) {
        return prisma.role.findUnique({
            where: { id }
        })
    },

    update(
        id: number,
        data: {
            nom?: string
            description?: string
            actif?: boolean
        }
    ) {
        return prisma.role.update({
            where: { id },
            data
        })
    }
}
