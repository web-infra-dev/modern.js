import { Schema } from '@modern-js/easy-form-core';
import { i18n, localeKeys } from '../locale';
import { BooleanConfig, BooleanSchemas } from './boolean';

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
