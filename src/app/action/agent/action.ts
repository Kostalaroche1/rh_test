// import { JsonObject, JsonValue } from "@/generated/prisma/runtime/client";
import { generateMatricule } from "@/services/generateMat";

 export async function AddAgent(data : any) { 
  data.matricule = generateMatricule()
    try {
     const responses = await fetch('../api/agent', {
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
   export async function AddAgentWithAccount(data : any) { 
  data.matricule = generateMatricule()
  console.log(data , 'data compte')
    try {
     const responses = await fetch('../api/agent/agentWithAccount', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify(data)
      });
      const rep = await responses.json()
      return rep;
    } catch (error) {
      return error;
    } 
  }
   export async function StatAgent() { 
    try {
     const responses = await fetch('../api/agent/agUserCompteNumber', {
        method: 'GET',
        headers: {'content-type': 'application/json'},
      });
      console.log(responses , "response ")
      const response = await responses.json()
      return response.data;
    } catch (error) {
      return error;
    } 
  }

   export async function updateAgent(data : any) { 
    try {
     const responses = await fetch('../api/agent', {
        method: 'PUT',
        headers: {'content-type': 'application/json'},
        body : JSON.stringify(data)
      });
      console.log(responses , "response ")
      const response = await responses.json()
      return response.data;
    } catch (error) {
      return error;
    } 
  }

   export async function deleteAgent(data : any) { 
    try {
     const responses = await fetch('../api/agent', {
        method: 'DELETE',
        headers: {'content-type': 'application/json'},
        body : JSON.stringify(data)
      });
      
      const response = await responses.json()
      console.log(response , "response supprimé")
      return response.data;
    } catch (error) {
      return error;
    } 
  }
  export const forgotPassword = async (email: string) => {
  try {
    const res = await fetch('../api/agent/forgotPassword', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(email),
    });

    const data = await res.json();
    console.log(data , "Recuperation de compte")
    return data;
  } catch (error) {
    console.error(error);
    return { status: 500, error };
  }
};

export const resetPassword = async (newPassword: string) => {
  console.log(newPassword , 'dans actions')
  try {
    const res = await fetch("../api/agent/resetPassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPassword),
    });

    const data = await res.json();
    return data;
  } catch (error) {
    console.error(error);
    return { status: 500, error };
  }
};


  