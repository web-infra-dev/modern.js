import {
  DEFAULT_I18NEXT_DETECTION_OPTIONS,
  mergeDetectionOptions,
} from '../runtime/i18n/detection/config.js';
import type { LanguageDetectorOptions } from '../runtime/i18n/instance';

/**
 * Detect language from request using the same detection logic as i18next
 * This ensures consistency between server-side and client-side detection
 */
export function detectLanguageFromRequest(
  req: {
    url: string;
    headers:
      | Headers
      | { get: (name: string) => string | null }
      | Record<string, string | string[] | undefined>;
  },
  languages: string[],
  detectionOptions?: LanguageDetectorOptions,
): string | null {
  try {
    // Merge user detection options with defaults
    const mergedDetection = detectionOptions
      ? mergeDetectionOptions(detectionOptions)
      : DEFAULT_I18NEXT_DETECTION_OPTIONS;

    // Get detection order, excluding 'path' and browser-only detectors
    const order = (mergedDetection.order || []).filter(
      (item: string) =>
        !['path', 'localStorage', 'navigator', 'htmlTag', 'subdomain'].includes(
          item,
        ),
    );

    // If no order specified, use default server-side order
    const detectionOrder =
      order.length > 0 ? order : ['querystring', 'cookie', 'header'];

    // Helper to get header value
    // req.headers is a Fetch API Headers instance when the caller passes the raw
    // Request (e.g. ssrContext.request.raw), but modern.js's own SSR request object
    // (ssrContext.request) carries headers as a plain, lower-cased key/value object.
    const getHeader = (name: string): string | null => {
      const headers = req.headers;
      if (typeof (headers as Headers)?.get === 'function') {
        return (headers as Headers).get(name);
      }
      const value = (headers as Record<string, string | string[] | undefined>)[
        name.toLowerCase()
      ];
      if (Array.isArray(value)) {
        return value[0] ?? null;
      }
      return value ?? null;
    };

    // Try each detection method in order
    for (const method of detectionOrder) {
      let detectedLang: string | null = null;

      switch (method) {
        case 'querystring': {
          const lookupKey =
            mergedDetection.lookupQuerystring ||
            DEFAULT_I18NEXT_DETECTION_OPTIONS.lookupQuerystring ||
            'lng';
          const host = getHeader('host') || 'localhost';
          const url = new URL(req.url, `http://${host}`);
          detectedLang = url.searchParams.get(lookupKey);
          break;
        }
        case 'cookie': {
          const lookupKey =
            mergedDetection.lookupCookie ||
            DEFAULT_I18NEXT_DETECTION_OPTIONS.lookupCookie ||
            'i18next';
          const cookieHeader = getHeader('Cookie');
          if (cookieHeader) {
            const cookies = cookieHeader
              .split(';')
              .reduce((acc: Record<string, string>, item: string) => {
                const [key, value] = item.trim().split('=');
                if (key && value) {
                  acc[key] = value;
                }
                return acc;
              }, {});
            detectedLang = cookies[lookupKey] || null;
          }
          break;
        }
        case 'header': {
          const lookupKey =
            mergedDetection.lookupHeader ||
            DEFAULT_I18NEXT_DETECTION_OPTIONS.lookupHeader ||
            'accept-language';
          const acceptLanguage = getHeader(lookupKey);
          if (acceptLanguage) {
            // Parse Accept-Language header: "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7"
            const languagesList = acceptLanguage
              .split(',')
              .map((lang: string) => {
                const [code, q] = lang.trim().split(';');
                return {
                  code,
                  baseCode: code.split('-')[0],
                  quality: q ? parseFloat(q.split('=')[1]) : 1.0,
                };
              })
              .sort(
                (a: { quality: number }, b: { quality: number }) =>
                  b.quality - a.quality,
              );

            // Find first matching language, preferring an exact tag match
            // (e.g. 'zh-Hant-TW') over the base language code (e.g. 'zh')
            for (const lang of languagesList) {
              if (languages.length === 0 || languages.includes(lang.code)) {
                detectedLang = lang.code;
                break;
              }
              if (languages.includes(lang.baseCode)) {
                detectedLang = lang.baseCode;
                break;
              }
            }
          }
          break;
        }
      }

      // If detected and valid, return it
      if (
        detectedLang &&
        (languages.length === 0 || languages.includes(detectedLang))
      ) {
        return detectedLang;
      }

      // Match query and cookie values like header values: exact tag first,
      // then the supported base language (e.g. 'zh-CN' -> 'zh').
      if (detectedLang) {
        const baseLang = detectedLang.split('-')[0];
        if (languages.includes(baseLang)) {
          return baseLang;
        }
      }
    }
  } catch (error) {
    // Silently ignore errors
  }

  return null;
}
