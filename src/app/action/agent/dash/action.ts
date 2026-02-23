
export async function GetDashAgent() {
    try {
        const responses = await fetch('../api/agent/dash', {
            method: 'GET',
        });
       
        console.log(responses, "response insideaction ")
        const response = await responses.json()
 console.log(response, "response inside action GETAGENT SERVICE")
        return response.data;
    } catch (error) {
        return error;
    }
}

export async function GetDashAgentAdmin() {
    try {
        const responses = await fetch('../api/agent/dash/dashAdmin', {
            method: 'GET',
        });
       
        console.log(responses, "response insideaction ")
        const response = await responses.json()
 console.log(response, "response inside action GETAGENT SERVICE")
        return response.data;
    } catch (error) {
        return error;
    }
}