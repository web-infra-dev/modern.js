import { Schema } from '@modern-js/easy-form-core';
import { i18n, localeKeys } from '@/locale';

export enum BFFType {
  Func = 'func',
  Framework = 'framework',
}

export enum BFFFramework {
  Egg = 'egg',
  Koa = 'koa',
  Express = 'express',
  Nest = 'nest',
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

const BFFFrameworkSchema: Schema = {
  key: 'bffFramework',
  type: ['string'],
  label: () => i18n.t(localeKeys.bff.bffFramework.self),
  mutualExclusion: true,
  items: Object.values(BFFFramework).map(framework => ({
    key: framework,
    label: () => i18n.t(localeKeys.bff.bffFramework[framework]),
  })),
};

const BFFSchemaMap = {
  bffType: BFFTypeSchema,
  bffFramework: BFFFrameworkSchema,
};
export const BFFSchema: Schema = {
  key: 'bff',
  label: () => i18n.t(localeKeys.action.function.bff),
  isObject: true,
  items: Object.values(BFFSchemaMap),
};
