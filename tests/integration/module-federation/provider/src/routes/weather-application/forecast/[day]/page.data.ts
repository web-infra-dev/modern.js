import { forecastDays } from '../../../../weather-days';

export const loader = ({
  request,
  params,
}: {
  request: Request;
  params: { day?: string };
}) => {
  const day = forecastDays.find(item => item.id === params.day);
  if (!day) throw new Response('Forecast not found', { status: 404 });
  const url = new URL(request.url);
  const endpoint = new URL('/bridge-data', process.env.MF_LAB_API);
  const cancelToken = crypto.randomUUID();
  endpoint.search = url.search;
  endpoint.searchParams.set('day', day.id);
  endpoint.searchParams.set('cancelToken', cancelToken);
  endpoint.searchParams.set(
    'probe',
    url.searchParams.get('probe') || `weather-${day.id}`,
  );
  const detail = fetch(endpoint, { signal: request.signal }).then(
    async response => {
      if (!response.ok) throw new Error('The detailed outlook is unavailable');
      return response.json();
    },
  );
  return { day, detail, cancelToken };
};
