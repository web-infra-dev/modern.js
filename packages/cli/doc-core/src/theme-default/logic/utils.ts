import { normalizeHref } from '@/runtime';

export function isEqualPath(a: string, b: string) {
  return normalizeHref(a) === normalizeHref(b);
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
