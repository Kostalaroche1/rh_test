// import { JsonObject } from "@/generated/prisma/runtime/client";
export async function forgot(data:any) {
    if(data.email === "Haba@gmail.com") return true;
    return false;
}