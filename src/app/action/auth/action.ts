import { getAuthenticatedUser } from "@/security/auth";


 export async function getAuth() { 
    try {
     const responses = await getAuthenticatedUser();
      console.log(responses , "response ")
      return responses;
    } catch (error) {
      return error;
    } 
  }