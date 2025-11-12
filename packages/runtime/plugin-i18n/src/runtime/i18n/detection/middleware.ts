import LanguageDetector from 'i18next-browser-languagedetector';
import type { I18nInstance } from '../instance';

export const useI18nextLanguageDetector = (i18nInstance: I18nInstance) => {
  return i18nInstance.use(LanguageDetector);
};

export const detectLanguage = (
  i18nInstance: I18nInstance,
  _request?: any,
): string | undefined => {
  // Access the detector from i18next services
  // The detector is registered via useI18nextLanguageDetector() and initialized in init()
  const detector = i18nInstance.services?.languageDetector;
  if (detector && typeof detector.detect === 'function') {
    try {
      const result = detector.detect();
      // detector.detect() can return string | string[] | undefined
      if (typeof result === 'string') {
        return result;
      }
      if (Array.isArray(result) && result.length > 0) {
        return result[0];
      }
    } catch (error) {
      return undefined;
    }
  }
  return undefined;
};
