import { LanguageDetector } from 'i18next-http-middleware';
import {
  type I18nInstance,
  getActualI18nextInstance,
  isI18nWrapperInstance,
} from '../instance';

type LanguageDetectorInitOptions = Parameters<LanguageDetector['init']>[1];
type LanguageDetectorDetect = (
  request: any,
  response: any,
  detectionOrder?: string[],
) => string | string[] | undefined;

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
    const detectorInstance = isI18nWrapperInstance(i18nInstance)
      ? getActualI18nextInstance(i18nInstance)
      : i18nInstance;
    const instanceToUse = detectorInstance || i18nInstance;
    const detector =
      instanceToUse.services?.languageDetector ||
      i18nInstance.services?.languageDetector;
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

    const isInitialized = Boolean(
      i18nInstance.isInitialized || instanceToUse.isInitialized,
    );
    const servicesToUse = instanceToUse.services || i18nInstance.services;
    const instanceOptions = instanceToUse.options || i18nInstance.options;

    if (isInitialized && servicesToUse && instanceOptions) {
      const manualDetector = new LanguageDetector();
      const optionsToUse = detectionOptions
        ? { ...instanceOptions, detection: detectionOptions }
        : instanceOptions;
      manualDetector.init(
        servicesToUse,
        optionsToUse as LanguageDetectorInitOptions,
      );

      const detect = manualDetector.detect as unknown as LanguageDetectorDetect;
      const result = detect(request, {}, undefined);
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
