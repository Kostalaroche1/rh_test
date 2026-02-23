

export async function AddPointPresence(data: any) {
    try {
        const responses = await fetch('../api/agent/presence', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(data)
        });
        const response = await responses.json()

        console.log(responses, "response insideaction ", "and response", response)

        return response.result;
    } catch (error) {
        return error;
    }
}
export async function GetPresence() {
    try {
        const responses = await fetch('../api/agent/presence', {
            method: 'GET',
            next: { revalidate: 10 }
        });
        if (!responses.ok) {
            return []
        }
        const response = await responses.json();
        console.log(response.getData, 'dans dans action get presence')

        return response.getData;
    } catch (error) {
        return [];
    }
}

export async function UpdatePresence(data: any) {
    try {
        const responses = await fetch('../api/agent/presence', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!responses.ok) {
            return null
        }
        console.log(responses, "response insideaction ")
        const response = await responses.json()

        return response.result
    } catch (error) {
        return null;
    }
}

export async function DeletePresence(data: any) {
    try {
        const responses = await fetch('../api/agent/presence', {
            method: 'DELETE',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!responses.ok) {
            return null
        }
        const response = await responses.json()

        console.log(response, "response inside delete action server")
        return response.result;
    } catch (error) {
        return null;
    }
}
