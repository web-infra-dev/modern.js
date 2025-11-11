import { getGlobalBasename } from '@modern-js/runtime/context';
import { MAIN_ENTRY_NAME } from '@modern-js/utils/universal/constants';

export const getEntryPath = (): string => {
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
