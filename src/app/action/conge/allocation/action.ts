
export async function AddAllocation(data: any) {
    try {
        const responses = await fetch('../api/agent/conge', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(data)
        });
        console.log(responses, "response insideaction ", "and data", data)
        return responses;
    } catch (error) {
        return error;
    }
}
