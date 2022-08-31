import { I18n } from '@modern-js/plugin-i18n';
import { ZH_LOCALE } from './zh';
import { EN_LOCALE } from './en';

const i18n = new I18n();

const localeKeys = i18n.init('zh', { zh: ZH_LOCALE, en: EN_LOCALE });

export { i18n, localeKeys };
