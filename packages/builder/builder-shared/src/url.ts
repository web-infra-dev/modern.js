import { URL } from 'url';
import path from 'path';

export const withPublicPath = (str: string, base: string) => {
  // The use of an absolute URL without a protocol is technically legal,
  // however it cannot be parsed as a URL instance.
  // Just return it.
  // e.g. str is //example.com/foo.js
  if (str.startsWith('//')) {
    return str;
  }

  // Only absolute url with hostname & protocol can be parsed into URL instance.
  // e.g. str is https://example.com/foo.js
  try {
    return new URL(str).toString();
  } catch {}

  // Or it should be a relative path.
  // Let's join the publicPath.
  // e.g. str is ./foo.js
  try {
    // `base` is a url with hostname & protocol.
    // e.g. base is https://example.com/static
    const url = new URL(base);
    url.pathname = path.posix.resolve(url.pathname, str);
    return url.toString();
  } catch {
    // without hostname & protocol.
    // e.g. base is /
    return path.posix.resolve(base, str);
  }
};
