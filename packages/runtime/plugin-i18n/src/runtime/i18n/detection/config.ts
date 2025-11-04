import type { LanguageDetectorOptions } from '../instance';

export const DEFAULT_I18NEXT_DETECTION_OPTIONS = {
  caches: ['cookie', 'localStorage'],
  order: [
    'querystring',
    'cookie',
    'localStorage',
    'header',
    'navigator',
    'htmlTag',
    'path',
    'subdomain',
  ],
  cookieMinutes: 60 * 24 * 365,
  lookupQuerystring: 'lng',
  lookupCookie: 'i18next',
  lookupLocalStorage: 'i18nextLng',
  lookupHeader: 'accept-language',
};

/**
 * Deep merge detection options, merging user options with default options
 * @param defaultOptions - Default detection options
 * @param userOptions - User-provided detection options (optional)
 * @returns Merged detection options
 */
export function mergeDetectionOptions(
  userOptions?: LanguageDetectorOptions,
  defaultOptions: LanguageDetectorOptions = DEFAULT_I18NEXT_DETECTION_OPTIONS,
): LanguageDetectorOptions {
  if (!userOptions) {
    return defaultOptions;
  }

  const merged: Record<string, any> = { ...defaultOptions };
  const userOptionsRecord = userOptions as Record<string, any>;

  // Deep merge nested objects
  for (const key in userOptions) {
    if (userOptionsRecord[key] !== undefined) {
      const userValue = userOptionsRecord[key];
      const defaultValue = merged[key];

      // If both are objects (but not arrays or Date), deep merge them
      if (
        userValue &&
        typeof userValue === 'object' &&
        !Array.isArray(userValue) &&
        !(userValue instanceof Date) &&
        defaultValue &&
        typeof defaultValue === 'object' &&
        !Array.isArray(defaultValue) &&
        !(defaultValue instanceof Date)
      ) {
        merged[key] = mergeDetectionOptions(
          defaultValue as LanguageDetectorOptions,
          userValue as LanguageDetectorOptions,
        );
      } else {
        // Otherwise, use user value (which overrides default)
        merged[key] = userValue;
      }
    }
  }

  return merged as LanguageDetectorOptions;
}
