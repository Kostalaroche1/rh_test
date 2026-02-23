// // lib/prisma.ts
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// export default prisma;

// src/lib/prisma.ts

import { PrismaClient } from "@prisma/client"

export const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: ["error"]
    })

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma
}

export default prisma
