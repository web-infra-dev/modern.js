import { Schema } from '@modern-js/easy-form-core';
import {
  BooleanConfig,
  Language,
  LanguageSchema,
  PackageManager,
  PackageManagerSchema,
  PackageNameSchema,
  PackagePathSchema,
} from '../common';
import {
  ClientRouteSchema,
  RunWay,
  RunWaySchema,
  NeedModifyMWAConfigSchema,
  ClientRoute,
} from './common';

export const MWASchemas = [
  PackageNameSchema,
  PackagePathSchema,
  LanguageSchema,
  PackageManagerSchema,
  RunWaySchema,
  NeedModifyMWAConfigSchema,
  ClientRouteSchema,
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
};
