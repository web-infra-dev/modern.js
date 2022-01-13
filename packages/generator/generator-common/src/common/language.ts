import { Schema } from '@modern-js/easy-form-core';
import { i18n, localeKeys } from '../locale';

export enum Language {
  TS = 'ts',
  JS = 'js',
}

export const LanguageName: Record<string, () => string> = {
  [Language.TS]: () => 'TS',
  [Language.JS]: () => 'ES6+',
};

export const LanguageSchema: Schema = {
  key: 'language',
  type: ['string'],
  label: () => i18n.t(localeKeys.language.self),
  mutualExclusion: true,
  items: Object.values(Language).map(language => ({
    key: language,
    label: LanguageName[language],
  })),
};
