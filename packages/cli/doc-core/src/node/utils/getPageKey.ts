import { removeLeadingSlash } from './normalizePath';

export function getPageKey(route: string) {
  const cleanRoute = removeLeadingSlash(route);
  return cleanRoute.replace(/\//g, '_') || 'index';
}
