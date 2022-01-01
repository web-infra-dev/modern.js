import { Schema } from '@modern-js/easy-form-core';
import { FrameworkSchema, Framework } from './common';
import { i18n, localeKeys } from '../locale';

export enum BFFType {
  Func = 'func',
  // eslint-disable-next-line @typescript-eslint/no-shadow
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
