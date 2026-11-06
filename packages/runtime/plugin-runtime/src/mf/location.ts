export function normalizeBasename(value: string) {
  if (!value.startsWith('/') || value.includes('//') || /[?#\\]/.test(value))
    throw new Error(
      'Remote basename must be an absolute pathname without query or hash.',
    );
  return value.replace(/\/+$/, '') || '/';
}

/** Strip only a complete pathname prefix. Search, hash and encoded segments survive. */
export function removeBasename(
  url: string,
  basename: string,
): string | undefined {
  const base = normalizeBasename(basename);
  if (base === '/') return url;
  if (!url.toLowerCase().startsWith(base.toLowerCase())) return;
  const suffix = url.slice(base.length);
  if (suffix && !['/', '?', '#'].includes(suffix[0])) return;
  return suffix.startsWith('/') ? suffix : `/${suffix}`;
}

export function addBasename(url: string, basename: string) {
  const base = normalizeBasename(basename);
  if (base === '/') return url;
  return `${base}${url === '/' ? '' : /^\/[?#]/.test(url) ? url.slice(1) : url}`;
}
