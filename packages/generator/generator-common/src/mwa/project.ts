import { Schema } from '@modern-js/codesmith-formily';
import {
  BooleanConfig,
  getPackageNameSchema,
  getPackagePathSchema,
  Language,
  getLanguageSchema,
  PackageManager,
  getPackageManagerSchema,
} from '../common';
import {
  getClientRouteSchema,
  getNeedModifyMWAConfigSchema,
  ClientRoute,
} from './common';

export const getMWASchemaProperties = (
  extra: Record<string, any>,
): Schema['properties'] => {
  return {
    packageName: getPackageNameSchema(extra),
    packagePath: getPackagePathSchema(extra),
    language: getLanguageSchema(extra),
    packageManager: getPackageManagerSchema(extra),
    needModifyMWAConfig: getNeedModifyMWAConfigSchema(extra),
    clientRoute: getClientRouteSchema(extra),
  };
};

export const getMWASchema = (extra: Record<string, any> = {}): Schema => {
  return {
    type: 'object',
    properties: getMWASchemaProperties(extra),
  };
};

export const MWADefaultConfig = {
  language: Language.TS,
  packageManager: PackageManager.Pnpm,
  needModifyMWAConfig: BooleanConfig.NO,
  clientRoute: ClientRoute.SelfControlRoute,
};
