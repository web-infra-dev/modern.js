export const QUERY_REGEXP = /\?.*$/s;
export const HASH_REGEXP = /#.*$/s;
export const MDX_REGEXP = /\.mdx?$/;
export const APPEARANCE_KEY = 'modern-theme-appearance';

export const SEARCH_INDEX_NAME = 'search_index';

export const isSCM = () => Boolean(process.env.BUILD_VERSION);

export const isProduction = () => process.env.NODE_ENV === 'production';

export const isDebugMode = () => Boolean(process.env.DOC_DEBUG);

export const cleanUrl = (url: string): string =>
  url.replace(HASH_REGEXP, '').replace(QUERY_REGEXP, '');

export const inBrowser = () => !process.env.__SSR__;

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

export function isExternalUrl(url: string) {
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('mailto:') ||
    url.startsWith('tel:')
  );
}

export function replaceLang(
  rawUrl: string,
  targetLang: string,
  defaultLang: string,
  langs: string[],
  base = '',
) {
  let url = removeBase(rawUrl, base);
  // modernjs.dev/builder + switch to en -> modernjs.dev/builder/en/index.html
  if (!url) {
    url = '/index.html';
  }
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
  hash: string;
} => {
  const [withoutHash, hash = ''] = url.split('#');
  return {
    url: withoutHash,
    hash,
  };
};

export function normalizeHref(url?: string) {
  if (!url) {
    return '/';
  }
  if (isExternalUrl(url)) {
    return url;
  }

  // eslint-disable-next-line prefer-const
  let { url: cleanUrl, hash } = parseUrl(url);

  // Ignore email and telephone links
  if (url.startsWith('mailto:') || url.startsWith('tel:')) {
    return url;
  }

  if (!cleanUrl.endsWith('.html')) {
    if (cleanUrl.endsWith('/')) {
      cleanUrl += 'index.html';
    } else {
      cleanUrl += '.html';
    }
  }

  return addLeadingSlash(hash ? `${cleanUrl}#${hash}` : cleanUrl);
}

export function withoutLang(path: string, langs: string[]) {
  const langRegexp = new RegExp(`^\\/(${langs.join('|')})`);
  return addLeadingSlash(path.replace(langRegexp, ''));
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
