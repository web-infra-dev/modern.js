import { Import } from '@modern-js/utils';

const i18n: typeof import('@modern-js/plugin-i18n/language-detector') =
  Import.lazy('@modern-js/plugin-i18n/language-detector', require);

export function getLocaleLanguage() {
  const detector = new i18n.I18CLILanguageDetector();
  return detector.detect();
}
