import { fixture } from '../../weather-fixture';

export const loader = async ({ request }: { request: Request }) => {
  if (new URL(request.url).searchParams.get('labData') === 'local')
    return { weather: fixture };
  const response = await fetch(`${process.env.MF_LAB_API}/weather`, {
    signal: request.signal,
  });
  if (!response.ok) throw new Error('Weather station unavailable');
  return { weather: await response.json() };
};
