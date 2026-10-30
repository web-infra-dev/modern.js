export const loader = ({
  params,
  request,
}: {
  params: Record<string, string>;
  request: Request;
}) => {
  const url = new URL(request.url);
  if (url.searchParams.has('fail'))
    throw new Error('Station loader unavailable');
  const result = { id: params.id };
  const probe = url.searchParams.get('routeProbe');
  if (!probe) return result;
  // The browser still uses Modern's normal server-loader endpoint. Only this
  // opt-in request waits for the lab service so history races remain observable.
  const service = new URL('/route-loader', process.env.MF_LAB_API);
  service.searchParams.set('probe', probe);
  service.searchParams.set('path', url.pathname);
  return fetch(service, { signal: request.signal }).then(async response => {
    if (!response.ok) throw new Error('Route loader service unavailable');
    await response.json();
    return result;
  });
};
