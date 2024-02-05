export function parseQuery(request: Request) {
  const { url } = request;
  const q = url.split('?')[1];

  const query: Record<string, string> = {};

  if (q) {
    q.split('&').forEach(item => {
      const [key, value] = item.split('=');
      query[key] = value;
    });
  }

  return query;
}

export function parseHeaders(request: Request) {
  const headersData: Record<string, string | undefined> = {};
  request.headers.forEach((value, key) => {
    headersData[key] = value;
  });

  return headersData;
}

// fork from hono
export function getPathname(request: Request): string {
  // Optimized: RegExp is faster than indexOf() + slice()
  const match = request.url.match(/^https?:\/\/[^/]+(\/[^?]*)/);
  return match ? match[1] : '/';
}

export function getHost(request: Request): string {
  const { headers } = request;
  let host = headers.get('X-Forwarded-Host');
  if (!host) {
    host = headers.get('Host');
  }
  host = host?.split(/\s*,\s*/, 1)[0] || 'undefined';
  // the host = '',if we can't cat Host or X-Forwarded-Host header
  // but the this.href would assign a invalid value:`http[s]://${pathname}`
  // so we need assign host a no-empty value.
  return host;
}
