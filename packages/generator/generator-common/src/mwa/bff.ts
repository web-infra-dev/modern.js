import { Schema } from '@modern-js/easy-form-core';
import { i18n, localeKeys } from '../locale';
import { FrameworkSchema, Framework } from './common';

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

export const BFFSchemas = [BFFTypeSchema, FrameworkSchema];

export const BFFSchema: Schema = {
  key: 'bff',
  label: () => i18n.t(localeKeys.action.function.bff),
  isObject: true,
  items: BFFSchemas,
};

export const MWADefaultBffConfig = {
  bffType: BFFType.Func,
  frameWork: Framework.Express,
};
