import { roleRepository } from "@/repositories/roleRepository";

export async function listerRoles() {
    return roleRepository.findAll()
}
