import { Schema } from '@modern-js/easy-form-core';
import { i18n, localeKeys } from '../locale';
import { BooleanConfig, BooleanSchemas } from '../common';

export enum CDNType {
  OSS = 'oss',
  COS = 'cos',
  NO = 'no',
}

export enum LambdaType {
  FC = 'fc',
  SCF = 'scf',
  NO = 'no',
}

export const CloudTypeSchema: Schema = {
  key: 'disableModernServer',
  type: ['string'],
  label: () => i18n.t(localeKeys.deploy.cloud.self),
  mutualExclusion: true,
  state: {
    value: BooleanConfig.NO,
  },
  items: BooleanSchemas,
};

export const CDNTypeSchema: Schema = {
  key: 'cdnType',
  type: ['string'],
  label: () => i18n.t(localeKeys.deploy.cdn.self),
  mutualExclusion: true,
  items: Object.values(CDNType).map(deployType => ({
    key: deployType,
    label: () => i18n.t(localeKeys.deploy.cdn[deployType]),
  })),
};

export const LambdaTypeSchema: Schema = {
  key: 'lambdaType',
  type: ['string'],
  label: () => i18n.t(localeKeys.deploy.lambda.self),
  mutualExclusion: true,
  when: values => values.disableModernServer === BooleanConfig.NO,
  items: Object.values(LambdaType).map(deployType => ({
    key: deployType,
    label: () => i18n.t(localeKeys.deploy.lambda[deployType]),
  })),
};

export const DeployTypeSchema: Schema = {
  key: 'Deploy',
  isObject: true,
  items: [CloudTypeSchema, CDNTypeSchema, LambdaTypeSchema],
};
