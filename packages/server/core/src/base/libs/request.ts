export function parseQuery(url: string) {
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

export function parseHeaders(headers: Headers) {
  const headersData: Record<string, string | undefined> = {};
  headers.forEach((value, key) => {
    headersData[key] = value;
  });

  return headersData;
}
