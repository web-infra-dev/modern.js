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
      | {
          get: (name: string) => string | null;
        }
      | Headers;
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
    const getHeader = (name: string): string | null => {
      if (req.headers instanceof Headers) {
        return req.headers.get(name);
      }
      return req.headers.get(name);
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
                  code: code.split('-')[0], // Extract base language code
                  quality: q ? parseFloat(q.split('=')[1]) : 1.0,
                };
              })
              .sort(
                (a: { quality: number }, b: { quality: number }) =>
                  b.quality - a.quality,
              );

            // Find first matching language
            for (const lang of languagesList) {
              if (languages.length === 0 || languages.includes(lang.code)) {
                detectedLang = lang.code;
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
    }
  } catch (error) {
    // Silently ignore errors
  }

  return null;
}
