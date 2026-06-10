import { LanguageDetector } from 'i18next-http-middleware';
import {
  type I18nInstance,
  getActualI18nextInstance,
  isI18nWrapperInstance,
} from '../instance';

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
    const actualInstance = isI18nWrapperInstance(i18nInstance)
      ? getActualI18nextInstance(i18nInstance)
      : i18nInstance;
    const detector =
      actualInstance?.services?.languageDetector ||
      i18nInstance.services?.languageDetector;
    if (detector && typeof detector.detect === 'function') {
      const result = detector.detect(request, {}, detectionOptions?.order);
      if (typeof result === 'string') {
        return result;
      }
      if (Array.isArray(result) && result.length > 0) {
        return result[0];
      }
      return undefined;
    }

    if (
      (i18nInstance.isInitialized || actualInstance?.isInitialized) &&
      (actualInstance?.services || i18nInstance.services) &&
      (actualInstance?.options || i18nInstance.options)
    ) {
      const manualDetector = new LanguageDetector();
      const servicesToUse = actualInstance?.services || i18nInstance.services;
      const instanceOptions = actualInstance?.options || i18nInstance.options;
      const optionsToUse = detectionOptions
        ? { ...instanceOptions, detection: detectionOptions }
        : instanceOptions;
      manualDetector.init(servicesToUse!, optionsToUse as any);

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
