import { roleRepository } from "@/repositories/roleRepository"


export async function modifierRole(
    id: number,
    data: {
        nom?: string
        description?: string
        actif?: boolean
    }
) {
    return roleRepository.update(id, data)
}
