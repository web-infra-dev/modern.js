import { Schema } from '@modern-js/easy-form-core';
import { FrameworkSchema } from './common';
import { i18n, localeKeys } from '@/locale';

export enum BFFType {
  Func = 'func',
  Framework = 'framework',
}

export const BFFTypeSchema: Schema = {
  key: 'bffType',
  type: ['string'],
  label: () => i18n.t(localeKeys.bff.bffType.self),
  mutualExclusion: true,
  items: Object.values(BFFType).map(bffType => ({
    key: bffType,
    label: () => i18n.t(localeKeys.bff.bffType[bffType]),
  })),
};

const BFFSchemaMap = {
  bffType: BFFTypeSchema,
  framework: FrameworkSchema,
};
export const BFFSchema: Schema = {
  key: 'bff',
  label: () => i18n.t(localeKeys.action.function.bff),
  isObject: true,
  items: Object.values(BFFSchemaMap),
};
