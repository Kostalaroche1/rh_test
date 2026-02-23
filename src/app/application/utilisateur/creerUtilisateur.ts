import { utilisateurRepository } from "@/repositories/utilisateurRepository"
import { utilisateurRoleRepository } from "@/repositories/utilisateurRoleRepository"
import bcrypt from "bcryptjs"

export async function creerUtilisateur(
    login: string,
    motDePasse: string,
    roleId: number,
    creePar: number
) {
    const hashedPassword = await bcrypt.hash(motDePasse, 10)

    const user = await utilisateurRepository.create({
        login,
        motDePasse: hashedPassword
    })

    await utilisateurRoleRepository.assign(user.id, roleId, creePar)

    return user
}
