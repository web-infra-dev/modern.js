export async function loadWeather(kind: string, request: Request) {
  const endpoint = new URL('/bridge-weather', process.env.MF_LAB_API);
  endpoint.searchParams.set('kind', kind);
  const response = await fetch(endpoint, { signal: request.signal });
  if (!response.ok) throw new Error('Weather bulletin unavailable');
  return response.json();
}
