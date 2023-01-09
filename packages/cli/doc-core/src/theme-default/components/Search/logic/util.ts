import type { Header } from './search';

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

export function normalizeContent(content: string) {
  // Do not match the content in code block
  // Do not match the frontmatter
  return content.replace(/```(.*?)```/gms, '').replace(/---(.*?)---/gms, '');
}

export function formatText(text: string) {
  return text.length > MAX_TITLE_LENGTH
    ? `${text.slice(0, MAX_TITLE_LENGTH)}...`
    : text;
}
