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

type Query = Record<string, string>;

export function parseQuery(req: Request): Query {
  const query: Query = {};

  const { url } = req;

  const q = url.split('?')[1];

  if (q) {
    const search = new URLSearchParams(q);
    search.forEach((v, k) => {
      query[k] = v;
    });
  }

  return query;
}
