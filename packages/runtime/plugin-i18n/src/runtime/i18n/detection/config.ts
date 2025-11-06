import type { RuntimeContext } from '@modern-js/runtime';
import { deepMerge } from '../../../shared/deepMerge';
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
 * @param userOptions - User-provided detection options (optional)
 * @param defaultOptions - Default detection options
 * @returns Merged detection options
 */
export function mergeDetectionOptions(
  userOptions?: LanguageDetectorOptions,
  defaultOptions: LanguageDetectorOptions = DEFAULT_I18NEXT_DETECTION_OPTIONS,
): LanguageDetectorOptions {
  return deepMerge(defaultOptions, userOptions);
}

export function exportServerLngToWindow(context: RuntimeContext, lng: string) {
  context.__i18nData__ = { lng };
}
