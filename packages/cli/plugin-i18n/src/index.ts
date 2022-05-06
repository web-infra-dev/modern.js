import { get } from '@modern-js/utils/lodash';
import { getObjKeyMap } from './utils';

type Language = string;

interface LanguageModel {
  [Key: string]: string | LanguageModel;
}

type LanguageModelMap = Record<Language, LanguageModel>;

type TFunc = (
  key: string,
  vars?: { [key: string]: string },
  fallbackText?: string,
) => string;
type TI18n = {
  t: TFunc;
  changeLanguage: (config: ChangeLanguageConfig) => void;
  lang: (lang: Language) => { t: TFunc };
};

export interface ChangeLanguageConfig {
  locale?: Language;
}

class I18n implements TI18n {
  private language: Language = 'en';

  private languageMap: LanguageModelMap = {};

  private format(msg: string, vars: { [key: string]: string }) {
    return msg.replace(/\{([^}]+)\}/gm, (_match, capture: string) =>
      Object.prototype.hasOwnProperty.call(vars, capture)
        ? vars[capture]
        : capture,
    );
  }

  private getMessage(
    lang: string,
    key: string,
    vars?: { [key: string]: string },
    fallbackText?: string,
  ) {
    // 判断语言当前语料库是否存在，不存在使用 en 作为默认语言
    const languages = Object.keys(this.languageMap);
    const resultLang = languages.find(l => l === lang);
    if (!resultLang && languages.length === 0) {
      return fallbackText || key;
    }
    const model: LanguageModel =
      this.languageMap[resultLang || 'en' || languages[0]];
    if (!model) {
      return fallbackText || key;
    }
    const message = get(model, key);
    const value = message || fallbackText || key;
    if (typeof value === 'string') {
      return this.format(value, vars || {});
    }
    throw new Error('key is not a string');
  }

  public init<T extends LanguageModel>(
    language?: Language,
    languageMap?: Record<Language, T>,
  ) {
    this.language = language || 'en';
    if (languageMap) {
      this.languageMap = languageMap;
    }
    return getObjKeyMap(this.languageMap[this.language]) as T;
  }

  public changeLanguage(config: ChangeLanguageConfig) {
    this.language = config.locale || 'en';
  }

  public t(
    key: string,
    vars?: { [key: string]: string },
    fallbackText?: string,
  ) {
    return this.getMessage(this.language, key, vars, fallbackText);
  }

  public lang(lang: string) {
    return {
      t: (
        key: string,
        vars?: { [key: string]: string },
        fallbackText?: string,
      ): string => this.getMessage(lang, key, vars, fallbackText),
    };
  }
}

export { I18n };
