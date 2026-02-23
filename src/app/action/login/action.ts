// import { JsonObject, JsonValue } from "@/generated/prisma/runtime/client";

 async function HandleLogin(data : any) { 
    try {
     const responses = await fetch('../api/auth/login', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({data})
      });
      console.log(responses , "responses api login")
      alert('Login successful');
    } catch (error) {
      alert('Login successful');
    } finally {
    //   setLoading(false)
    }
  }