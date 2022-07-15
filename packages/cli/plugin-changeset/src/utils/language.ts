import { I18CLILanguageDetector } from '@modern-js/plugin-i18n/language-detector';

export function getLocaleLanguage() {
  const detector = new I18CLILanguageDetector();
  return detector.detect();
}
