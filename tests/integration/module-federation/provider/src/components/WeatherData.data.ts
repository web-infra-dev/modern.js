import type { WeatherData } from '../weather-ui';

// The current adapter calls CSR loaders both during prefetch and consumption.
// Reuse their promise within one browser document. Never cache server requests.
const clientRequests = new Map<string, Promise<WeatherData>>();
export function fetchData(params?: { _id?: string }): Promise<WeatherData> {
  const key = typeof window !== 'undefined' ? params?._id : undefined;
  if (key && clientRequests.has(key)) return clientRequests.get(key)!;
  const request = fetch(`${process.env.MF_LAB_API}/weather`)
    .then(response => {
      if (!response.ok) throw new Error('Local weather request failed');
      return response.json() as Promise<WeatherData>;
    })
    .catch(error => {
      if (key) clientRequests.delete(key);
      throw error;
    });
  if (key) clientRequests.set(key, request);
  return request;
}
