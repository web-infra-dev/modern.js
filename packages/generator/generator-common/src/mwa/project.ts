import { Schema } from '@modern-js/easy-form-core';
import { NeedModifyMWAConfigSchema, RunWay, RunWaySchema } from './common';
import {
  BooleanConfig,
  Language,
  LanguageSchema,
  PackageManager,
  PackageManagerSchema,
  PackageNameSchema,
  PackagePathSchema,
} from '@/common';

const MWASchemaMap = {
  packageName: PackageNameSchema,
  packagePath: PackagePathSchema,
  language: LanguageSchema,
  packageManager: PackageManagerSchema,
  runWay: RunWaySchema,
  needModifyMWAConfig: NeedModifyMWAConfigSchema,
};

export const MWASchema: Schema = {
  key: 'mwa',
  isObject: true,
  items: Object.values(MWASchemaMap),
};

export const MWADefaultConfig = {
  language: Language.TS,
  packageManager: PackageManager.Pnpm,
  runWay: RunWay.No,
  needModifyMWAConfig: BooleanConfig.NO,
};
