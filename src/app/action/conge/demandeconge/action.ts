



export async function AddDemandeConge(data: any) {
    try {
        const responses = await fetch('../api/agent/conge/demande', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(data)
        });
        const response = await responses.json()
        if (!responses.ok) {
            return {
                success: false,
                message: response.message || "erreur survenue"
            }
        }
        return {
            success: true,
            message: response || "success"
        };
    } catch (error) {
        return {
            success: false,
            message: "erreur serveur"
        }
    }
}

export async function UpdateDemandeConge(data: any) {
    try {
        const responses: any = await fetch('../api/agent/conge/demande', {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(data)
        });

        const response = await responses.json()
        if (!responses.ok) {
            return {
                success: false,
                message: response.message || "Une erreur est survenue."
            }
        }

        console.log(responses, "response inside action updqte presence  qnd response ", response)

        return {
            success: true,
            data: response
        }

    } catch (error) {
        return {
            success: false,
            message: "Erreur réseau."
        }
    }
}


export async function GetDemandeConge() {
    try {
        const responses = await fetch('../api/agent/conge/demande', {
            method: 'GET',
            next: { revalidate: 10 }
        });
        if (!responses.ok) {
            return []
        }
        const response = await responses.json();
        console.log(response, 'dans dans actionn demande congé')

        return response;
    } catch (error) {
        return error;
    }
}
export async function GetAllDemandeConge() {
    try {
        const responses = await fetch('../api/agent/conge/demande/all', {
            method: 'GET',
            next: { revalidate: 10 }
        });
        if (!responses.ok) {
            return []
        }
        const response = await responses.json();
        console.log(response, 'dans dans actionn demande congé')

        return response;
    } catch (error) {
        return error;
    }
}

export async function DeletDemandeConge(data: any) {
    console.log(data, 'inside delete method')
    try {
        const responses = await fetch('../api/agent/conge/demande', {
            method: 'DELETE',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!responses.ok) {
            return null
        }
        const response = await responses.json()
        console.log(responses, "responses inside delete action server and response", response)
        return response;
    } catch (error) {
        return error;
    }
}








// export async function AddDemandeConge(data: any) {
//     try {
//         const responses = await fetch('../api/agent/conge/demande', {
//             method: 'POST',
//             headers: { 'content-type': 'application/json' },
//             body: JSON.stringify(data)
//         });
//         if (!responses.ok) {
//             return null
//         }
//         const response = await responses.json()

//         console.log(response, "response insideaction ")
//         return response;
//     } catch (error) {
//         return error;
//     }
// }

// export async function UpdateDemandeConge(data: any) {
//     try {
//         const responses : any = await fetch('../api/agent/conge/demande', {
//             method: 'PUT',
//             headers: { 'content-type': 'application/json' },
//             body: JSON.stringify(data)
//         });
        
//         const response = await responses.json()
//         console.log(response.message, "response insideaction ")
//         return response;
//     } catch (error) {
//         return error;
//     }
// }


// export async function GetDemandeConge() {
//     try {
//         const responses = await fetch('../api/agent/conge/demande', {
//             method: 'GET',
//             next: { revalidate: 10 }
//         });
//         if (!responses.ok) {
//             return []
//         }
//         const response = await responses.json();
//         console.log(response, 'dans dans actionn demande congé')

//         return response;
//     } catch (error) {
//         return error;
//     }
// }

// export async function DeletDemandeConge(data: any) {
//     console.log(data, 'inside delete method')
//     try {
//         const responses = await fetch('../api/agent/conge/demande', {
//             method: 'DELETE',
//             headers: { 'content-type': 'application/json' },
//             body: JSON.stringify(data)
//         });
//         if (!responses.ok) {
//             return null
//         }
//         const response = await responses.json()
//         console.log(responses, "responses inside delete action server and response", response)
//         return response;
//     } catch (error) {
//         return error;
//     }
// }
