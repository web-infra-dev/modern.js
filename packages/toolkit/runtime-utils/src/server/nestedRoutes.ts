import type { ServerRoute } from '@modern-js/types';

function sortByUrlPath(entries: ServerRoute[]): ServerRoute[] {
  entries.sort(function (a, b) {
    const length1 = a.urlPath.length;
    const length2 = b.urlPath.length;
    if (length1 < length2) {
      return 1;
    }
    if (length1 > length2) {
      return -1;
    }
    return 0;
  });
  return entries;
}

export const matchEntry = (pathname: string, entries: ServerRoute[]) => {
  sortByUrlPath(entries);
  return entries.find(entry => pathname.startsWith(entry.urlPath));
};
