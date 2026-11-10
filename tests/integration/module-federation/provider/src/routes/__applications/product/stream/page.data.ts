export const loader = ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const probe = url.searchParams.get('probe') || 'station';
  const endpoint = new URL('/bridge-data', process.env.MF_LAB_API);
  endpoint.search = url.search;
  const detail = fetch(endpoint, { signal: request.signal }).then(
    async response => {
      if (!response.ok) throw new Error('Detail unavailable');
      return response.json();
    },
  );
  return { probe, detail };
};
