import { roleRepository } from "../../../repositories/roleRepository"

export async function creerRole(nom: string, description?: string) {
    return roleRepository.create({ nom, description })
}
