// import { JsonObject, JsonValue } from "@/generated/prisma/runtime/client";
 export async function GetRole() { 
    try {
     const responses = await fetch('../api/agent/role', {
        method: 'GET',
        next : {revalidate : 10}
      });
      const response = await responses.json();
      console.log(response ,'ROLES dans action')
      return response;
    } catch (error) {
      return error;
    } 
  }

  export async function AddRole(data :any) { 
    try {
     const responses = await fetch('../api/agent/role', {
        method: 'POST',
        headers : {'content-type' : 'application/json'},
        body : JSON.stringify(data)
      });
      const response = await responses.json();
      console.log(response ,'ROLES dans action')
      return response;
    } catch (error) {
      return error;
    } 
  }