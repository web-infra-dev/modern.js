import { Schema } from '@modern-js/easy-form-core';
import { BooleanConfig, getBooleanSchemas } from './boolean';
import { i18n, localeKeys } from '@/locale';

export const EnableLessSchema: Schema = {
  key: 'enableLess',
  type: ['string'],
  label: () => i18n.t(localeKeys.needModifyConfig.enableLess),
  when: (_, extra) =>
    extra?.isEmptySrc === undefined ? true : Boolean(extra?.isEmptySrc),
  mutualExclusion: true,
  state: {
    value: BooleanConfig.NO,
  },
  items: getBooleanSchemas(),
};

export const EnableSassSchema: Schema = {
  key: 'enableSass',
  type: ['string'],
  label: () => i18n.t(localeKeys.needModifyConfig.enableSass),
  when: (_, extra) =>
    extra?.isEmptySrc === undefined ? true : Boolean(extra?.isEmptySrc),
  mutualExclusion: true,
  state: {
    value: BooleanConfig.NO,
  },
  items: getBooleanSchemas(),
};
