import { getGlobalBasename } from '@modern-js/runtime/context';
import { MAIN_ENTRY_NAME } from '@modern-js/utils/universal/constants';

export const getEntryPath = (entryName?: string): string => {
  const basename = getGlobalBasename();
  if (basename) {
    return basename === '/' ? '' : basename;
  }
  return '';
};

/**
 * Helper function to get language from current pathname
 * @param pathname - The current pathname
 * @param languages - Array of supported languages
 * @param fallbackLanguage - Fallback language when no language is detected
 * @returns The detected language or fallback language
 */
export const getLanguageFromPath = (
  pathname: string,
  languages: string[],
  fallbackLanguage: string,
): string => {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (languages.includes(firstSegment)) {
    return firstSegment;
  }

  return fallbackLanguage;
};

/**
 * Helper function to build localized URL
 * @param pathname - The current pathname
 * @param language - The target language
 * @param languages - Array of supported languages
 * @returns The localized URL path
 */
export const buildLocalizedUrl = (
  pathname: string,
  language: string,
  languages: string[],
): string => {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length > 0 && languages.includes(segments[0])) {
    // Replace existing language prefix
    segments[0] = language;
  } else {
    // Add language prefix
    segments.unshift(language);
  }

  return `/${segments.join('/')}`;
};

/**
 * Validate languages array configuration
 * @param languages - Array of language codes to validate
 * @returns true if all languages are valid, false otherwise
 */
export const validateLanguages = (languages: string[]): boolean => {
  return languages.every(lang => typeof lang === 'string' && lang.length > 0);
};

/**
 * Get language from SSR data in a type-safe way
 * @param window - The window object
 * @returns The language from SSR data or undefined
 */
export const getLanguageFromSSRData = (window: Window): string | undefined => {
  // Type-safe access to SSR data via global Window interface
  const ssrData = window._SSR_DATA;
  return ssrData?.data?.i18nData?.lng;
};

/**
 * Detect language from pathname
 * @param pathname - The current pathname
 * @param entryName - The entry name
 * @param languages - Array of supported languages
 * @param localePathRedirect - Whether path-based locale detection is enabled
 * @returns Detection result with detected flag and optional language
 */
export const detectLanguageFromPath = (
  pathname: string,
  entryName: string | undefined,
  languages: string[],
  localePathRedirect: boolean,
): {
  detected: boolean;
  language?: string;
} => {
  if (!localePathRedirect) {
    return { detected: false };
  }

  const relativePath = pathname.replace(getEntryPath(entryName), '');
  const segments = relativePath.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && languages.includes(firstSegment)) {
    return { detected: true, language: firstSegment };
  }

  return { detected: false };
};
