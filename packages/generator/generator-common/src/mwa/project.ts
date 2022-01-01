import { Schema } from '@modern-js/easy-form-core';
import {
  ClientRouteSchema,
  DisableStateManagementSchema,
  NeedModifyMWAConfigSchema,
  RunWay,
  RunWaySchema,
  EnableMWALessSchema,
  EnableMWASassSchema,
  ClientRoute,
} from './common';
import {
  BooleanConfig,
  Language,
  LanguageSchema,
  PackageManager,
  PackageManagerSchema,
  PackageNameSchema,
  PackagePathSchema,
} from '../common';

export const MWASchemas = [
  PackageNameSchema,
  PackagePathSchema,
  LanguageSchema,
  PackageManagerSchema,
  RunWaySchema,
  NeedModifyMWAConfigSchema,
  ClientRouteSchema,
  DisableStateManagementSchema,
  EnableMWALessSchema,
  EnableMWASassSchema,
];

export const MWASchema: Schema = {
  key: 'mwa',
  isObject: true,
  items: MWASchemas,
};

export const MWADefaultConfig = {
  language: Language.TS,
  packageManager: PackageManager.Pnpm,
  runWay: RunWay.No,
  needModifyMWAConfig: BooleanConfig.NO,
  clientRoute: ClientRoute.SelfControlRoute,
  disableStateManagement: BooleanConfig.NO,
  enableLess: BooleanConfig.NO,
  enableSass: BooleanConfig.NO,
};
