import { roleRepository } from "@/repositories/roleRepository";


export async function desactiverRole(id: number) {
    return roleRepository.update(id, { actif: false })
}
