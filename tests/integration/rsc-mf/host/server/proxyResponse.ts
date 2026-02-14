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
const STATUS_CODES_WITHOUT_BODY = new Set([204, 205, 304]);

const isResponseStatusWithoutBody = (status: number) =>
  STATUS_CODES_WITHOUT_BODY.has(status);

const normalizeConnectionHeaderToken = (token: string) =>
  token
    .trim()
    .replace(/^"+|"+$/g, '')
    .trim()
    .toLowerCase();

export const createSafeProxyResponse = (upstream: Response) => {
  const headers = new Headers(upstream.headers);
  for (const headerName of PROXY_UNSAFE_RESPONSE_HEADERS) {
    headers.delete(headerName);
  }
  const connectionHeaderTokens = (upstream.headers.get('connection') || '')
    .split(',')
    .map(normalizeConnectionHeaderToken)
    .filter(Boolean);
  for (const token of connectionHeaderTokens) {
    headers.delete(token);
  }
  const responseBody = isResponseStatusWithoutBody(upstream.status)
    ? null
    : upstream.body;
  return new Response(responseBody, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
};
