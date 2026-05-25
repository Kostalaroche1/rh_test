


export async function AddPointPresence(data: any) {
    try {
        const response = await fetch('/api/agent/presence', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                message: result.message || "Une erreur est survenue."
            }
        }

        return {
            success: true,
            data: result
        }

    } catch (error) {
        return {
            success: false,
            message: "Erreur réseau."
        }
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


export async function GetTodayPresence() {
    try {
        const responses = await fetch('../api/agent/presence/today', {
            method: 'GET',
            next: { revalidate: 10 }
        });
        if (!responses.ok) {
            return []
        }
        const response = await responses.json();
        console.log(response.getData, 'dans dans action get presence')

        return response;
    } catch (error) {
        return [];
    }
}

export async function getAllPresence() {
    try {
        const responses = await fetch('../api/agent/presence/admin', {
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

export async function getAllPresencePointages() {
    try {
        const responses = await fetch('../api/agent/presence/pointages', {
            method: 'GET',
            next: { revalidate: 10 }
        });
        if (!responses.ok) {
            return []
        }
        const response = await responses.json();
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
        const result = await responses.json()

        if (!responses.ok) {
            return {
                success: false,
                message: result.message || "Une erreur est survenue."
            }
        }

        console.log(responses, "response inside action updqte presence  qnd response ", result)

        return {
            success: true,
            data: result
        }

    } catch (error) {
        return {
            success: false,
            message: "Erreur réseau."
        }
    }
}

export async function UpdatePresencePointage(data: any) {
    try {
        const responses = await fetch('../api/agent/presence/pointages', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await responses.json()

        if (!responses.ok) {
            return {
                success: false,
                message: result.message || "Une erreur est survenue."
            }
        }

        return {
            success: true,
            data: result
        }

    } catch (error) {
        return {
            success: false,
            message: "Erreur rÃ©seau."
        }
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




// export async function AddPointPresence(data: any) {
//     try {
//         const responses = await fetch('../api/agent/presence', {
//             method: 'POST',
//             headers: { 'content-type': 'application/json' },
//             body: JSON.stringify(data)
//         });
//         const response = await responses.json()

//         console.log(responses, "response insideaction ", "and response", response)

//         return response.result;
//     } catch (error) {
//         return error;
//     }
// }
// export async function GetPresence() {
//     try {
//         const responses = await fetch('../api/agent/presence', {
//             method: 'GET',
//             next: { revalidate: 10 }
//         });
//         if (!responses.ok) {
//             return []
//         }
//         const response = await responses.json();
//         console.log(response.getData, 'dans dans action get presence')

//         return response.getData;
//     } catch (error) {
//         return [];
//     }
// }

// export async function UpdatePresence(data: any) {
//     try {
//         const responses = await fetch('../api/agent/presence', {
//             method: 'PUT',
//             headers: { 'content-type': 'application/json' },
//             body: JSON.stringify(data)
//         });
//         if (!responses.ok) {
//             return null
//         }
//         console.log(responses, "response insideaction ")
//         const response = await responses.json()

//         return response.result
//     } catch (error) {
//         return null;
//     }
// }

// export async function DeletePresence(data: any) {
//     try {
//         const responses = await fetch('../api/agent/presence', {
//             method: 'DELETE',
//             headers: { 'content-type': 'application/json' },
//             body: JSON.stringify(data)
//         });
//         if (!responses.ok) {
//             return null
//         }
//         const response = await responses.json()

//         console.log(response, "response inside delete action server")
//         return response.result;
//     } catch (error) {
//         return null;
//     }
// }
