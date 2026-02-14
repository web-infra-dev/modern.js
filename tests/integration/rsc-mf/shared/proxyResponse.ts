const PROXY_UNSAFE_RESPONSE_HEADERS = [
  'content-length',
  'content-encoding',
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-connection',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
];

export const createSafeProxyResponse = (upstream: Response) => {
  const headers = new Headers(upstream.headers);
  for (const headerName of PROXY_UNSAFE_RESPONSE_HEADERS) {
    headers.delete(headerName);
  }
  const connectionHeaderTokens = (upstream.headers.get('connection') || '')
    .split(',')
    .map(token => token.trim().toLowerCase())
    .filter(Boolean);
  for (const token of connectionHeaderTokens) {
    headers.delete(token);
  }
  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  });
};
