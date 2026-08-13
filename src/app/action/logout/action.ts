// import { JsonObject, JsonValue } from "@/generated/prisma/runtime/client";
 export async function Logouts() { 
    try {
     const responses = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {'content-type': 'application/json'}
      });
      console.log(responses , "responses api login")
      return responses
    } catch (error) {
      // alert('Login successful');
    } finally {
    //   setLoading(false)
    }
  }
