export type Query = Record<string, string>;

export function parseQuery(req: Request): Query {
  const query: Query = {};

  const { url } = req;

  const q = url.split('?')[1];

  if (q) {
    // eslint-disable-next-line node/prefer-global/url-search-params
    const search = new URLSearchParams(q);
    search.forEach((v, k) => {
      query[k] = v;
    });
  }

  return query;
}

export type HeadersData = Record<string, string | undefined>;

export function parseHeaders(request: Request): HeadersData {
  const headersData: HeadersData = {};
  request.headers.forEach((value, key) => {
    headersData[key] = value;
  });

  return headersData;
}

/**
 * The function is modified based on
 * https://github.com/honojs/hono/blob/main/src/utils/url.ts
 *
 * MIT Licensed
 * https://github.com/honojs/hono/blob/main/LICENSE
 *
 */
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

type Cookie = Record<string, string>;

export function parseCookie(req: Request): Cookie {
  // Cookie: name=value; name2=value2; name3=value3
  // Pairs in the list are separated by a semicolon and a space ('; ').
  const _cookie = req.headers.get('Cookie');

  const cookie: Cookie = {};

  _cookie
    ?.trim()
    .split(';')
    .forEach(item => {
      // every item is name=value
      const [k, v] = item.trim().split('=');

      if (k) {
        cookie[k] = v;
      }
    });

  return cookie;
}
