import { normalizeHref, withBase } from '@/runtime';

export function isEqualPath(a: string, b: string) {
  return withBase(normalizeHref(a)) === withBase(normalizeHref(b));
}

export function isActive(
  currentPath: string,
  targetLink?: string,
  strict = false,
) {
  if (!targetLink) {
    return false;
  }
  if (strict) {
    return isEqualPath(currentPath, targetLink);
  } else {
    return (
      isEqualPath(currentPath, targetLink) || currentPath.startsWith(targetLink)
    );
  }
}

export function isExternalHref(href: string) {
  return /^https?:\/\//.test(href);
}
