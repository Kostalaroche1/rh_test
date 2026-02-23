
export async function GETAgentServices() {
  try {
    const responses = await fetch('../api/carrieres/agents', {
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


export async function GetAgentsForCarriere() {
  const res = await fetch(`../api/carrieres`);
  const data = await res.json();
  return data.data;
}

export async function GetAgentsProchesRetraite() {
  const res = await fetch(`../api/carrieres/retraite/proche`);
  const data = await res.json();
  return data.data;
}

export async function ValidationCarriere(datas: any) {
  console.log(datas, 'données à approbation carriere')
  const res = await fetch('../api/affectations/validation', {
    method: 'PUT',
    body: JSON.stringify(datas)
  });
  const data = await res.json();
  return data;
}

