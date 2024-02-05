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
