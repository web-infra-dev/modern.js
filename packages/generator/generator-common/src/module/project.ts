import { Schema } from '@modern-js/easy-form-core';
import { i18n, localeKeys } from '../locale';
import {
  BooleanConfig,
  BooleanSchemas,
  Language,
  LanguageSchema,
  PackageManager,
  PackageManagerSchema,
  PackageNameSchema,
  PackagePathSchema,
} from '../common';
import { EnableLessSchema, EnableSassSchema } from '../common/css';

export const moduleConfigWhenFunc = (values: Record<string, any>) =>
  values.needModifyModuleConfig === BooleanConfig.YES;

export const EnableModuleLessSchema: Schema = {
  ...EnableLessSchema,
  when: moduleConfigWhenFunc,
};

export const EnableModuleSassSchema: Schema = {
  ...EnableSassSchema,
  when: moduleConfigWhenFunc,
};

export const NeedModifyModuleConfigSchema: Schema = {
  key: 'needModifyModuleConfig',
  label: () => i18n.t(localeKeys.needModifyConfig.self),
  type: ['string'],
  mutualExclusion: true,
  state: {
    value: BooleanConfig.NO,
  },
  items: BooleanSchemas,
};

export const ModuleSchemas = [
  PackageNameSchema,
  PackagePathSchema,
  LanguageSchema,
  PackageManagerSchema,
  NeedModifyModuleConfigSchema,
  EnableModuleLessSchema,
  EnableModuleSassSchema,
];

export const ModuleSchema: Schema = {
  key: 'module',
  isObject: true,
  items: ModuleSchemas,
};

export const ModuleDefaultConfig = {
  language: Language.TS,
  packageManager: PackageManager.Pnpm,
  needModifyModuleConfig: BooleanConfig.NO,
  enableLess: BooleanConfig.NO,
  enableSass: BooleanConfig.NO,
};
