import { Import } from '@modern-js/utils';

const i18n: typeof import('@modern-js/plugin-i18n/language-detector') =
  Import.lazy('@modern-js/plugin-i18n/language-detector', require);

export function getLocaleLanguage() {
  const detector = new i18n.I18CLILanguageDetector();
  return detector.detect();
}

export const initLocalLanguage = async () => {
  const local = await import('../locale');
  const locale = getLocaleLanguage();
  local.i18n.changeLanguage({ locale });
  return local;
};
