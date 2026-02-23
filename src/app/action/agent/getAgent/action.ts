export async function GetAgent() { 
  try {
    const responses = await fetch('/api/agent', { method: 'GET' });
    const json = await responses.json();
    console.log(json.data , 'base de données')
    return json.data; 
  } catch (error) {
    console.error("GetAgent error:", error);
    return [];
  } 
}
