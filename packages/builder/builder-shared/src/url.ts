import { URL } from 'url';
import { urlJoin } from '@modern-js/utils';

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

  return urlJoin(base, str);
};
