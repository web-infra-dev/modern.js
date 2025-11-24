import LanguageDetector from 'i18next-browser-languagedetector';
import type { I18nInstance } from '../instance';
import { DEFAULT_I18NEXT_DETECTION_OPTIONS } from './config';

/**
 * Register LanguageDetector plugin to i18n instance
 * Must be called before init() to properly register the detector
 */
export const useI18nextLanguageDetector = (i18nInstance: I18nInstance) => {
  if (!i18nInstance.isInitialized) {
    return i18nInstance.use(LanguageDetector);
  }
  return i18nInstance;
};

/**
 * Read language directly from localStorage/cookie
 * Fallback when detector is not available in services
 */
const readLanguageFromStorage = (
  detectionOptions?: any,
): string | undefined => {
  try {
    const options = detectionOptions || {};
    const order = options.order || [
      'querystring',
      'cookie',
      'localStorage',
      'navigator',
      'htmlTag',
      'path',
      'subdomain',
    ];

    // Follow the detection order
    for (const method of order) {
      switch (method) {
        case 'querystring': {
          const lookupKey = options.lookupQuerystring || 'lng';
          const urlParams = new URLSearchParams(window.location.search);
          const lang = urlParams.get(lookupKey);
          if (lang) {
            return lang;
          }
          break;
        }
        case 'cookie': {
          const lookupKey = options.lookupCookie || 'i18next';
          const cookies = document.cookie
            .split(';')
            .reduce((acc: Record<string, string>, item: string) => {
              const [key, value] = item.trim().split('=');
              if (key && value) {
                acc[key] = decodeURIComponent(value);
              }
              return acc;
            }, {});
          if (cookies[lookupKey]) {
            return cookies[lookupKey];
          }
          break;
        }
        case 'localStorage': {
          const lookupKey = options.lookupLocalStorage || 'i18nextLng';
          const keysToCheck = [lookupKey];
          if (lookupKey === 'i18nextLng') {
            keysToCheck.push('i18next');
          }
          for (const key of keysToCheck) {
            const stored = localStorage.getItem(key);
            if (stored) {
              return stored;
            }
          }
          break;
        }
        case 'navigator': {
          if (navigator.language) {
            return navigator.language.split('-')[0];
          }
          break;
        }
        case 'htmlTag': {
          const htmlLang = document.documentElement.lang;
          if (htmlLang) {
            return htmlLang.split('-')[0];
          }
          break;
        }
      }
    }
  } catch (error) {
    // Ignore errors
  }

  return undefined;
};

/**
 * Detect language using i18next-browser-languagedetector
 * For initialized instances without detector in services, manually create a detector instance
 */
export const detectLanguage = (
  i18nInstance: I18nInstance,
  _request?: any,
  detectionOptions?: any,
): string | undefined => {
  try {
    const detector = i18nInstance.services?.languageDetector;
    if (detector && typeof detector.detect === 'function') {
      const result = detector.detect();
      if (typeof result === 'string') {
        return result;
      }
      if (Array.isArray(result) && result.length > 0) {
        return result[0];
      }
      return undefined;
    }

    if (i18nInstance.isInitialized) {
      const directRead = readLanguageFromStorage(detectionOptions);
      if (directRead) {
        return directRead;
      }

      if (i18nInstance.services && i18nInstance.options) {
        const manualDetector = new LanguageDetector();
        const optionsToUse = detectionOptions
          ? { ...i18nInstance.options, detection: detectionOptions }
          : i18nInstance.options;
        manualDetector.init(i18nInstance.services, optionsToUse as any);

        const result = manualDetector.detect();
        if (typeof result === 'string') {
          return result;
        }
        if (Array.isArray(result) && result.length > 0) {
          return result[0];
        }
      }
    }
  } catch (error) {
    return undefined;
  }

  return undefined;
};

/**
 * Set cookie with language value
 */
const setCookie = (
  name: string,
  value: string,
  options: {
    cookieMinutes?: number;
    cookieDomain?: string;
    cookiePath?: string;
  } = {},
): void => {
  if (typeof document === 'undefined') {
    return;
  }

  try {
    const {
      cookieMinutes = 60 * 24 * 365,
      cookieDomain,
      cookiePath = '/',
    } = options;

    const isInIframe = window.self !== window.top;
    const cookieEnabled = navigator.cookieEnabled;

    if (!cookieEnabled) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[i18n] Browser cookies are disabled');
      }
      return;
    }

    if (isInIframe && process.env.NODE_ENV === 'development') {
      console.warn(
        '[i18n] Page is in iframe, cookies may be blocked by browser policy',
      );
    }

    const expires = new Date();
    expires.setTime(expires.getTime() + cookieMinutes * 60 * 1000);

    const cookieStrings: string[] = [];
    cookieStrings.push(
      `${name}=${encodeURIComponent(value)}; path=${cookiePath}; expires=${expires.toUTCString()}`,
    );

    if (location.protocol === 'https:') {
      cookieStrings.push(
        `${name}=${encodeURIComponent(value)}; path=${cookiePath}; expires=${expires.toUTCString()}; SameSite=None; Secure`,
      );
    }

    cookieStrings.push(
      `${name}=${encodeURIComponent(value)}; path=${cookiePath}; expires=${expires.toUTCString()}; SameSite=Lax`,
    );

    if (cookieDomain) {
      cookieStrings.forEach((str, index) => {
        cookieStrings[index] = str.replace(
          `; path=${cookiePath}`,
          `; domain=${cookieDomain}; path=${cookiePath}`,
        );
      });
    }

    let cookieSet = false;
    for (const cookieString of cookieStrings) {
      try {
        document.cookie = cookieString;

        const cookieDescriptor =
          Object.getOwnPropertyDescriptor(Document.prototype, 'cookie') ||
          Object.getOwnPropertyDescriptor(HTMLDocument.prototype, 'cookie');
        if (cookieDescriptor?.set) {
          try {
            cookieDescriptor.set.call(document, cookieString);
          } catch (e) {
            // Ignore
          }
        }

        const newCookie = document.cookie;
        const cookies = newCookie
          .split(';')
          .reduce((acc: Record<string, string>, item: string) => {
            const [key, val] = item.trim().split('=');
            if (key && val) {
              acc[key] = decodeURIComponent(val);
            }
            return acc;
          }, {});

        if (cookies[name] === value) {
          cookieSet = true;
          break;
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[i18n] Error setting cookie format:`, error);
        }
      }
    }

    if (!cookieSet && process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        const finalCookies = document.cookie
          .split(';')
          .reduce((acc: Record<string, string>, item: string) => {
            const [key, val] = item.trim().split('=');
            if (key && val) {
              acc[key] = decodeURIComponent(val);
            }
            return acc;
          }, {});
        if (finalCookies[name] !== value) {
          console.warn(
            `[i18n] Cookie ${name} was not set. This may be due to browser privacy settings, extensions, or iframe restrictions.`,
          );
        }
      }, 200);
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to set cookie:', error);
    }
  }
};

/**
 * Cache user language to localStorage/cookie
 */
export const cacheUserLanguage = (
  i18nInstance: I18nInstance,
  language: string,
  detectionOptions?: any,
): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const userOptions = detectionOptions || i18nInstance.options?.detection;
    const options = {
      ...DEFAULT_I18NEXT_DETECTION_OPTIONS,
      ...userOptions,
    };
    const caches = options.caches;

    let shouldSetCookie = true;
    let shouldSetLocalStorage = true;

    if (caches === false) {
      shouldSetCookie = false;
      shouldSetLocalStorage = false;
    } else if (Array.isArray(caches)) {
      shouldSetCookie = caches.includes('cookie');
      shouldSetLocalStorage = caches.includes('localStorage');
    }

    if (shouldSetLocalStorage) {
      try {
        const lookupKey = options.lookupLocalStorage || 'i18nextLng';
        localStorage.setItem(lookupKey, language);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to set localStorage:', error);
        }
      }
    }

    if (shouldSetCookie) {
      const lookupKey = options.lookupCookie || 'i18next';
      setCookie(lookupKey, language, {
        cookieMinutes: options.cookieMinutes,
        cookieDomain: options.cookieDomain,
        cookiePath: options.cookiePath,
      });
    }

    const detector = i18nInstance.services?.languageDetector;
    if (detector && typeof detector.cacheUserLanguage === 'function') {
      try {
        detector.cacheUserLanguage(language);
      } catch (error) {
        // Ignore
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to cache user language:', error);
    }
  }
};
