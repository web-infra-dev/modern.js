import { Import } from '@modern-js/utils';

const i18n: typeof import('@modern-js/i18n-cli-language-detector') =
  Import.lazy('@modern-js/i18n-cli-language-detector', require);

export function getLocaleLanguage() {
  const detector = new i18n.I18CLILanguageDetector();
  return detector.detect();
}
