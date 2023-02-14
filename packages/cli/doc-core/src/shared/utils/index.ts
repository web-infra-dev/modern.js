export const QUERY_REGEXP = /\?.*$/s;
export const HASH_REGEXP = /#.*$/s;
export const MDX_REGEXP = /\.mdx?$/;
export const externalLinkRE = /^(https?:)/;

export const SEARCH_INDEX_NAME = 'search_index';

export const isProduction = () => process.env.NODE_ENV === 'production';

export const cleanUrl = (url: string): string =>
  url.replace(HASH_REGEXP, '').replace(QUERY_REGEXP, '');

export const inBrowser = () => typeof window !== 'undefined';

export function addLeadingSlash(url: string) {
  return url.charAt(0) === '/' || url.startsWith('https') ? url : `/${url}`;
}

export function removeLeadingSlash(url: string) {
  return url.charAt(0) === '/' ? url.slice(1) : url;
}

export function removeTrailingSlash(url: string) {
  return url.charAt(url.length - 1) === '/' ? url.slice(0, -1) : url;
}

export function normalizeSlash(url: string) {
  return removeTrailingSlash(addLeadingSlash(url));
}

export function replaceLang(
  rawUrl: string,
  targetLang: string,
  defaultLang: string,
  langs: string[],
  base = '',
) {
  const url = removeBase(rawUrl, base);
  const originalLang = url.split('/')[1];
  const inDefaultLang = !langs.includes(originalLang);
  let result: string;
  if (inDefaultLang) {
    if (targetLang === defaultLang) {
      result = url;
    } else {
      result = addLeadingSlash(`${targetLang}${url}`);
    }
  } else if (targetLang === defaultLang) {
    result = url.replace(`/${originalLang}`, '');
  } else {
    result = url.replace(originalLang, targetLang);
  }
  return withBase(result, base);
}

export const omit = (obj: Record<string, unknown>, keys: string[]) => {
  const ret = { ...obj };
  for (const key of keys) {
    delete ret[key];
  }
  return ret;
};

export const parseUrl = (
  url: string,
): {
  url: string;
  query: string;
  hash: string;
} => {
  const [withoutHash, hash = ''] = url.split('#');
  const [cleanedUrl, query = ''] = withoutHash.split('?');
  return {
    url: cleanedUrl,
    query,
    hash,
  };
};

export function normalizeHref(url?: string) {
  if (!url) {
    return '/';
  }
  let cleanUrl = url;
  if (!cleanUrl.endsWith('.html')) {
    if (cleanUrl.endsWith('/')) {
      cleanUrl += 'index.html';
    } else {
      cleanUrl += '.html';
    }
  }

  return addLeadingSlash(cleanUrl);
}

export function withoutLang(path: string, langs: string[]) {
  const langRegexp = new RegExp(`^\\/(${langs.join('|')})`);
  return addLeadingSlash(path).replace(langRegexp, '');
}

export function withoutBase(path: string, base = '') {
  return addLeadingSlash(path).replace(normalizeSlash(base), '');
}

export function withBase(url = '/', base = ''): string {
  const normalizedUrl = addLeadingSlash(url);
  const normalizedBase = normalizeSlash(base);
  // Avoid adding base path repeatly
  return normalizedUrl.startsWith(normalizedBase)
    ? normalizedUrl
    : `${normalizedBase}${normalizedUrl}`;
}

export function removeBase(url: string, base: string) {
  return addLeadingSlash(url).replace(normalizeSlash(base), '');
}

export function withoutHash(url: string) {
  return url.split('#')[0];
}
