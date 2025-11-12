import { LanguageDetector } from 'i18next-http-middleware';
import type { I18nInstance } from '../instance';

export const useI18nextLanguageDetector = (i18nInstance: I18nInstance) => {
  return i18nInstance.use(LanguageDetector);
};

export const detectLanguage = (
  i18nInstance: I18nInstance,
  request?: any,
): string | undefined => {
  const detector = i18nInstance.services?.languageDetector;
  if (detector && typeof detector.detect === 'function' && request) {
    try {
      const result = detector.detect(request, {});
      // detector.detect() can return string | string[] | undefined
      if (typeof result === 'string') {
        return result;
      }
      if (Array.isArray(result) && result.length > 0) {
        return result[0];
      }
      return undefined;
    } catch (error) {
      return undefined;
    }
  }
  return undefined;
};
