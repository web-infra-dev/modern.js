/** Fixture policy, shared by the Host and the independently running Service. */
export function updateRequestPolicy({ request }: { request: Request }) {
  const configured = (globalThis as any)[
    Symbol.for('weather-lab.request-policy')
  ];
  if (configured === 'wait' || configured === 'reject' || configured === 'csr')
    return configured;
  const value =
    request.headers.get('x-lab-update-policy') ||
    new URL(request.url).searchParams.get('__labPolicy');
  return value === 'csr' || value === 'reject' ? value : 'wait';
}
