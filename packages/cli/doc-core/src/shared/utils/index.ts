export const queryRE = /\?.*$/s;
export const hashRE = /#.*$/s;

export const cleanUrl = (url: string): string =>
  url.replace(hashRE, '').replace(queryRE, '');

export const inBrowser = () => typeof window !== 'undefined';

export function addLeadingSlash(url: string) {
  return url.charAt(0) === '/' || url.startsWith('https') ? url : `/${url}`;
}

export function removeTrailingSlash(url: string) {
  return url.charAt(url.length - 1) === '/' ? url.slice(0, -1) : url;
}

export function normalizeSlash(url: string) {
  return removeTrailingSlash(addLeadingSlash(url));
}

export function withBase(url: string, base: string) {
  const normalizedBase = normalizeSlash(base);
  const normalizedUrl = addLeadingSlash(url);
  return normalizedBase ? `${normalizedBase}${normalizedUrl}` : normalizedUrl;
}
