import { removeLeadingSlash } from '@/shared/utils';

export function getPageKey(route: string) {
  const cleanRoute = removeLeadingSlash(route);
  return cleanRoute.replace(/\//g, '_') || 'index';
}
