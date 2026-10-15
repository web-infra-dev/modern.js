import type { ServerRoute } from '@modern-js/types';

// Find the entry with the longest matching urlPath, the first one wins on a tie.
// It scans the entries instead of sorting them, as the array is shared by the server.
export const matchEntry = (pathname: string, entries: ServerRoute[]) => {
  let matched: ServerRoute | undefined;
  for (const entry of entries) {
    if (
      pathname.startsWith(entry.urlPath) &&
      (!matched || entry.urlPath.length > matched.urlPath.length)
    ) {
      matched = entry;
    }
  }
  return matched;
};
