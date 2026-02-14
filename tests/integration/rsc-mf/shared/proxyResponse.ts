const HOP_BY_HOP_RESPONSE_HEADERS = [
  'content-length',
  'content-encoding',
  'transfer-encoding',
];

export const createSafeProxyResponse = (upstream: Response) => {
  const headers = new Headers(upstream.headers);
  for (const headerName of HOP_BY_HOP_RESPONSE_HEADERS) {
    headers.delete(headerName);
  }
  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
};
