/**
 * we use `pathname.replace(/\/+$/, '')` to remove the '/' with end.
 *
 * examples:
 *
 * pathname1: '/api', pathname2: '/api/',
 * pathname1 as same as pathname2
 *
 * pathname3: '/', the nomalizeResult also as '/'
 */
export function normalizePathname(pathname: string): string {
  // biome-ignore lint/style/useTemplate: <explanation>
  const normalized = '/' + pathname.replace(/^\/+|\/+$/g, '');

  if (normalized === '/') {
    return normalized;
  }

  return normalized;
}
