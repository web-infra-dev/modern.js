/** Fixture policy, shared by the Host and the independently running Service. */
export function updateRequestPolicy({
  request,
  entryName,
}: {
  request: Request;
  entryName?: string;
}) {
  const configured = (globalThis as any)[
    Symbol.for('weather-lab.request-policy')
  ];
  if (configured === 'wait' || configured === 'reject' || configured === 'csr')
    return configured;
  const value =
    request.headers.get('x-lab-update-policy') ||
    new URL(request.url).searchParams.get('__labPolicy');
  if (value === 'csr' || value === 'reject') return value;
  if (value === 'csr-index') return entryName === 'index' ? 'csr' : 'wait';
  return 'wait';
}
