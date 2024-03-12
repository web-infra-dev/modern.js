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
export function normalizePathname(pathname: string) {
  if (pathname === '/') {
    return pathname;
  } else {
    return pathname.replace(/\/+$/, '');
  }
}
