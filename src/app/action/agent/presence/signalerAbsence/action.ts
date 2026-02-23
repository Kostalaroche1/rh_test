export async function SignalerAbsence(data: any) {
    try {
        const responses = await fetch('../api/agent/presence/signalerAbsence', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(data)
        });
        const response = await responses.json()

        console.log(responses, "response insideaction ", "and response", response)

        return response;
    } catch (error) {
        return error;
    }
}

export async function AnnulerAbsence(data: any) {
    console.log(data , "Annulation Agent absence")
    try {
        const responses = await fetch('../api/agent/presence/signalerAbsence', {
            method: 'DELETE',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(data)
        });
        const response = await responses.json()

        console.log(responses, "response insideaction ", "and response", response)

        return response;
    } catch (error) {
        return error;
    }
}