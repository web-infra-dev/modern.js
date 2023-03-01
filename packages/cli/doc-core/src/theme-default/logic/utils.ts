import { isDarkMode } from './useAppearance';
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

export function getLogoUrl(rawLogo: string | { dark: string; light: string }) {
  // If logo is a string, use it directly
  if (typeof rawLogo === 'string') {
    return rawLogo;
  }
  // If logo is an object, use dark/light mode logo
  return isDarkMode() ? rawLogo.dark : rawLogo.light;
}
