
export async function AddConge(data: any) {
    try {
        const responses = await fetch('../api/agent/conge', {
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


export async function GetVacance() {
    try {
        const responses = await fetch('../api/agent/conge', {
            method: 'GET',
            next: { revalidate: 10 }
        });
        if (!responses.ok) {
            return []
        }
        const response = await responses.json();
        console.log(response, 'dans dans action')

        return response;
    } catch (error) {
        return error;
    }
}

export async function UpdateTypeConge(data: any) {
    try {
        const responses = await fetch('../api/agent/conge', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!responses.ok) {
            return null
        }
        console.log(responses, "response insideaction ")
        const response = await responses.json()

        return response;
    } catch (error) {
        return error;
    }
}

export async function DeleteConge(data: any) {
    try {
        const responses = await fetch('../api/agent/conge', {
            method: 'DELETE',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!responses.ok) {
            return null
        }
        const response = await responses.json()

        console.log(response, "response inside delete action server")
        return responses;
    } catch (error) {
        return error;
    }
}
