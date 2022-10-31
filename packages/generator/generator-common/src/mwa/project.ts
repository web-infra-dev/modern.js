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

export const getMWASchemaProperties = (
  extra: Record<string, any>,
): Schema['properties'] => {
  return {
    packageName: getPackageNameSchema(extra),
    packagePath: getPackagePathSchema(extra),
    language: getLanguageSchema(extra),
    packageManager: getPackageManagerSchema(extra),
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
};
