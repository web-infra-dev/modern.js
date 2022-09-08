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
<<<<<<< HEAD
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
=======
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
>>>>>>> 4f77eb496 (feat: remove generator create project enable less and sass function (#1659))

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
