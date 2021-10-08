import { Schema } from '@modern-js/easy-form-core';
import { i18n, localeKeys } from '@/locale';
import {
  BooleanConfig,
  getBooleanSchemas,
  Language,
  LanguageSchema,
  PackageManager,
  PackageManagerSchema,
  PackageNameSchema,
  PackagePathSchema,
} from '@/common';
import { EnableLessSchema, EnableSassSchema } from '@/common/css';

const NeedModifyModuleConfigSchema: Schema = {
  key: 'needModifyModuleConfig',
  label: () => i18n.t(localeKeys.needModifyConfig.self),
  type: ['string'],
  mutualExclusion: true,
  state: {
    value: BooleanConfig.NO,
  },

  items: getBooleanSchemas([EnableLessSchema, EnableSassSchema]),
};

const ModuleSchemaMap = {
  packageName: PackageNameSchema,
  packagePath: PackagePathSchema,
  language: LanguageSchema,
  packageManager: PackageManagerSchema,
  needModifyModuleConfig: NeedModifyModuleConfigSchema,
};

export const ModuleSchema: Schema = {
  key: 'module',
  isObject: true,
  items: Object.values(ModuleSchemaMap),
};

export const ModuleDefaultConfig = {
  language: Language.TS,
  packageManager: PackageManager.Pnpm,
};
