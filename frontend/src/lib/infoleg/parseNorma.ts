export async function parseNormaViaApi(norma: any): Promise<any> {
  const baseUrl = 'http://host.docker.internal:8000';
  const response = await fetch(`${baseUrl}/api/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(norma),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Error parsing norma:', errorText);
    throw new Error(`Failed to parse norma: ${errorText}`);
  }

  return response.json();
}
