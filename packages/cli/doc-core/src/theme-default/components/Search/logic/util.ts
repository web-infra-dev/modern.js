import type { Header } from './search';
import { RemoteSearchIndexInfo } from '@/shared/types';

const MAX_TITLE_LENGTH = 20;

export function backTrackHeaders(
  rawHeaders: Header[],
  index: number,
): Header[] {
  let current = rawHeaders[index];
  let currentIndex = index;

  const res: Header[] = [current];
  while (current && current.depth > 2) {
    // If there is no parent header, we will stop the loop
    let matchedParent = false;
    for (let i = currentIndex - 1; i >= 0; i--) {
      const header = rawHeaders[i];
      if (header.depth > 1 && header.depth === current.depth - 1) {
        current = header;
        currentIndex = i;
        res.unshift(current);
        matchedParent = true;
        break;
      }
    }
    if (!matchedParent) {
      break;
    }
  }
  return res;
}

export function formatText(text: string) {
  return text.length > MAX_TITLE_LENGTH
    ? `${text.slice(0, MAX_TITLE_LENGTH)}...`
    : text;
}

export function normalizeTextCase(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function removeDomain(url: string) {
  return url.replace(/https?:\/\/[^/]+/, '');
}

export const normalizeSearchIndexes = (
  items: RemoteSearchIndexInfo[],
): { value: string; label: string }[] => {
  return items.map(item =>
    typeof item === 'string'
      ? {
          value: item,
          label: item,
        }
      : item,
  );
};
