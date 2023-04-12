import { RemoteSearchIndexInfo, Header } from '@/shared/types';

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

export function substrByBytes(str: string, start: number, len: number): string {
  let resultStr = '';
  let bytesCount = 0;
  const strLength = str.length;
  for (let i = 0; i < strLength; i++) {
    const charCode = str.charCodeAt(i);
    if (charCode > 255) {
      // Chinese character
      bytesCount += 3;
    } else {
      bytesCount++;
    }
    if (bytesCount > start + len) {
      break;
    } else if (bytesCount > start) {
      resultStr += str.charAt(i);
    }
  }
  return resultStr;
}

export function byteToCharIndex(str: string, byteIndex: number): number {
  let charIndex = 0;
  let byteCount = 0;

  for (let i = 0; i < str.length; i++) {
    if (byteCount >= byteIndex) {
      break;
    }

    if (str.charCodeAt(i) > 255) {
      // Chinese character
      byteCount += 3;
    } else {
      byteCount += 1;
    }

    charIndex++;
  }

  return charIndex;
}

/**
 *
 * @param str raw text content
 * @param start start index (char index)
 * @param length byte length for sliced string
 * @returns sliced string
 */
export function getSlicedStrByByteLength(
  str: string,
  start: number,
  length: number,
): string {
  const slicedStr = str.slice(start);
  return substrByBytes(slicedStr, 0, length);
}
