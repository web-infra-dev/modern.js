import { I18n } from '@modern-js/plugin-i18n';
import { EN_LOCALE } from './en';
import { ZH_LOCALE } from './zh';

const i18n = new I18n();

const localeKeys = i18n.init('en', { zh: ZH_LOCALE, en: EN_LOCALE });

export { i18n, localeKeys };
