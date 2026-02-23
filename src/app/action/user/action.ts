// import { JsonObject, JsonValue } from "@/generated/prisma/runtime/client";

import { generateMatricule } from "@/services/generateMat";

 export async function AddUser(data : any) { 
  // data.matricule = generateMatricule()
    try {
     const responses = await fetch('../api/utilisateur', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify(data)
      });
      // console.log(responses , "response ")
      return responses;
    } catch (error) {
      return error;
    } 
  }