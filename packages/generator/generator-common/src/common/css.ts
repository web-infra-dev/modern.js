import { Schema } from '@modern-js/easy-form-core';
import { BooleanConfig, BooleanSchemas } from './boolean';
import { i18n, localeKeys } from '../locale';

export const EnableLessSchema: Schema = {
  key: 'enableLess',
  type: ['string'],
  label: () => i18n.t(localeKeys.needModifyConfig.enableLess),
  mutualExclusion: true,
  state: {
    value: BooleanConfig.NO,
  },
  items: BooleanSchemas,
};

export const EnableSassSchema: Schema = {
  key: 'enableSass',
  type: ['string'],
  label: () => i18n.t(localeKeys.needModifyConfig.enableSass),
  mutualExclusion: true,
  state: {
    value: BooleanConfig.NO,
  },
  items: BooleanSchemas,
};
