import LanguageDetector from 'i18next-browser-languagedetector';
import type { I18nInstance } from '../instance';

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
 * Cache user language to localStorage/cookie
 * Uses LanguageDetector's cacheUserLanguage method when available
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
    // Try to use detector's cacheUserLanguage method first
    const detector = i18nInstance.services?.languageDetector;
    if (detector && typeof detector.cacheUserLanguage === 'function') {
      try {
        detector.cacheUserLanguage(language);
        return;
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            '[i18n] Failed to cache via detector, falling back to manual cache:',
            error,
          );
        }
      }
    }

    // Fallback: manually create detector instance if i18n is initialized
    if (
      i18nInstance.isInitialized &&
      i18nInstance.services &&
      i18nInstance.options
    ) {
      try {
        const userOptions = detectionOptions || i18nInstance.options?.detection;
        const optionsToUse = userOptions
          ? { ...i18nInstance.options, detection: userOptions }
          : i18nInstance.options;

        const manualDetector = new LanguageDetector();
        manualDetector.init(i18nInstance.services, optionsToUse as any);

        if (typeof manualDetector.cacheUserLanguage === 'function') {
          manualDetector.cacheUserLanguage(language);
          return;
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[i18n] Failed to create manual detector:', error);
        }
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to cache user language:', error);
    }
  }
};
