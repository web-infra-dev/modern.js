import { Schema } from '@modern-js/codesmith-formily';
import { i18n, localeKeys } from '../locale';
import { getFrameworkSchema, Framework } from './common';

export enum BFFType {
  Func = 'func',
  Framework = 'framework',
}

export const getBFFTypeSchema = (_extra: Record<string, any> = {}): Schema => {
  return {
    type: 'string',
    title: i18n.t(localeKeys.bff.bffType.self),
    enum: Object.values(BFFType).map(bffType => ({
      value: bffType,
      label: i18n.t(localeKeys.bff.bffType[bffType]),
    })),
  };
};

export const getBFFchemaProperties = (
  extra: Record<string, any>,
): Schema['properties'] => {
  return {
    bffType: getBFFTypeSchema(extra),
    framework: getFrameworkSchema(extra),
  };
};

export const getBFFSchema = (extra: Record<string, any> = {}): Schema => {
  return {
    type: 'object',
    properties: getBFFchemaProperties(extra),
  };
};

export const MWADefaultBffConfig = {
  bffType: BFFType.Func,
  frameWork: Framework.Express,
};
