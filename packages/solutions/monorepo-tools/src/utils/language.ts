import { I18CLILanguageDetector } from '@modern-js/i18n-cli-language-detector';

export function getLocaleLanguage() {
  const detector = new I18CLILanguageDetector();
  return detector.detect();
}
