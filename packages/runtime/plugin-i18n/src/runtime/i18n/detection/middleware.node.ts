import { LanguageDetector } from 'i18next-http-middleware';
import type { I18nInstance } from '../instance';

export const cacheUserLanguage = (
  _i18nInstance: I18nInstance,
  _language: string,
  _detectionOptions?: any,
): void => {
  return;
};

/**
 * Read language directly from storage (localStorage/cookie)
 * Not available in Node.js environment, returns undefined
 */
export const readLanguageFromStorage = (
  _detectionOptions?: any,
): string | undefined => {
  // In Node.js environment, storage-based detection is not available
  return undefined;
};
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
 * Detect language using i18next-http-middleware LanguageDetector
 * For initialized instances without detector in services, manually create a detector instance
 */
export const detectLanguage = (
  i18nInstance: I18nInstance,
  request?: any,
  detectionOptions?: any,
): string | undefined => {
  if (!request) {
    return undefined;
  }

  try {
    const detector = i18nInstance.services?.languageDetector;
    if (detector && typeof detector.detect === 'function') {
      const result = detector.detect(request, {});
      if (typeof result === 'string') {
        return result;
      }
      if (Array.isArray(result) && result.length > 0) {
        return result[0];
      }
      return undefined;
    }

    if (
      i18nInstance.isInitialized &&
      i18nInstance.services &&
      i18nInstance.options
    ) {
      const manualDetector = new LanguageDetector();
      const optionsToUse = detectionOptions
        ? { ...i18nInstance.options, detection: detectionOptions }
        : i18nInstance.options;
      manualDetector.init(i18nInstance.services, optionsToUse as any);

      const result = (manualDetector.detect as any)(request, {}, undefined);
      if (typeof result === 'string') {
        return result;
      }
      if (Array.isArray(result) && result.length > 0) {
        return result[0];
      }
      return undefined;
    }
  } catch (error) {
    return undefined;
  }

  return undefined;
};
