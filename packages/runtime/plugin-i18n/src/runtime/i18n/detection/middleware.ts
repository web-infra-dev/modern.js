import { isBrowser } from '@modern-js/runtime';
import LanguageDetector from 'i18next-browser-languagedetector';
import type { I18nInstance } from '../instance';
import { getActualI18nextInstance, isI18nWrapperInstance } from '../instance';

/**
 * Register LanguageDetector plugin to i18n instance
 * Must be called before init() to properly register the detector
 * For wrapper instances, ensure detector is registered on the underlying i18next instance
 */
export const useI18nextLanguageDetector = (i18nInstance: I18nInstance) => {
  if (!i18nInstance.isInitialized) {
    // For wrapper instances, also register on the underlying instance
    if (isI18nWrapperInstance(i18nInstance)) {
      const actualInstance = getActualI18nextInstance(i18nInstance);
      if (actualInstance && !actualInstance.isInitialized) {
        actualInstance.use(LanguageDetector);
      }
    }
    return i18nInstance.use(LanguageDetector);
  }
  return i18nInstance;
};

/**
 * Read language directly from localStorage/cookie
 * Fallback when detector is not available in services
 */
export const readLanguageFromStorage = (
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
 * For wrapper instances, access the underlying i18next instance's services
 */
export const detectLanguage = (
  i18nInstance: I18nInstance,
  _request?: any,
  detectionOptions?: any,
): string | undefined => {
  try {
    // For wrapper instances, get the underlying i18next instance
    const actualInstance = isI18nWrapperInstance(i18nInstance)
      ? getActualI18nextInstance(i18nInstance)
      : i18nInstance;

    // Check if either instance is initialized
    const isInitialized =
      i18nInstance.isInitialized || actualInstance?.isInitialized;

    // Try to get detector from services (prefer actual instance for wrapper)
    const detector =
      actualInstance?.services?.languageDetector ||
      i18nInstance.services?.languageDetector;
    if (detector && typeof detector.detect === 'function') {
      const result = detector.detect();
      if (typeof result === 'string') {
        return result;
      }
      if (Array.isArray(result) && result.length > 0) {
        return result[0];
      }
      // If detector exists but returns undefined, continue to fallback logic
    }

    // Fallback: read directly from storage (always try this in browser)
    // This is important for wrapper instances where detector might not be properly initialized
    if (isBrowser()) {
      const directRead = readLanguageFromStorage(detectionOptions);
      if (directRead) {
        return directRead;
      }
    }

    // If instance is initialized, try creating manual detector
    if (isInitialized) {
      // Use actual instance's services/options for wrapper, otherwise use wrapper's
      const servicesToUse = actualInstance?.services || i18nInstance.services;
      const optionsToUse = actualInstance?.options || i18nInstance.options;

      if (servicesToUse && optionsToUse) {
        const manualDetector = new LanguageDetector();
        const mergedOptions = detectionOptions
          ? { ...optionsToUse, detection: detectionOptions }
          : optionsToUse;
        manualDetector.init(servicesToUse, mergedOptions as any);

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
 * For wrapper instances, access the underlying i18next instance's services
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
    // For wrapper instances, get the underlying i18next instance
    const actualInstance = isI18nWrapperInstance(i18nInstance)
      ? getActualI18nextInstance(i18nInstance)
      : i18nInstance;

    // Try to use detector's cacheUserLanguage method first
    // Prefer actual instance's detector for wrapper instances
    const detector =
      actualInstance?.services?.languageDetector ||
      i18nInstance.services?.languageDetector;
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
    const isInitialized =
      i18nInstance.isInitialized || actualInstance?.isInitialized;
    const servicesToUse = actualInstance?.services || i18nInstance.services;
    const optionsToUse = actualInstance?.options || i18nInstance.options;

    if (isInitialized && servicesToUse && optionsToUse) {
      try {
        const userOptions = detectionOptions || optionsToUse?.detection;
        const mergedOptions = userOptions
          ? { ...optionsToUse, detection: userOptions }
          : optionsToUse;

        const manualDetector = new LanguageDetector();
        manualDetector.init(servicesToUse, mergedOptions as any);

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
