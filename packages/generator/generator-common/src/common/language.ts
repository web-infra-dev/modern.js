import { Schema } from '@modern-js/codesmith-formily';
import { i18n, localeKeys } from '../locale';

export enum Language {
  TS = 'ts',
  JS = 'js',
}

const LanguageName: Record<string, string> = {
  [Language.TS]: 'TS',
  [Language.JS]: 'ES6+',
};

export const getLanguageSchema = (_extra: Record<string, any> = {}): Schema => {
  return {
    type: 'string',
    title: i18n.t(localeKeys.language.self),
    enum: Object.values(Language).map(language => ({
      value: language,
      label: LanguageName[language],
    })),
  };
};
