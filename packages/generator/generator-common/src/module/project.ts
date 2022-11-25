import { Schema } from '@modern-js/codesmith-formily';
import {
  Language,
  getLanguageSchema,
  PackageManager,
  getPackageManagerSchema,
  getPackageNameSchema,
  getPackagePathSchema,
} from '../common';

export const getModuleSchemaProperties = (
  extra: Record<string, any>,
): Schema['properties'] => {
  return {
    packageName: getPackageNameSchema(extra),
    packagePath: getPackagePathSchema(extra),
    language: getLanguageSchema(extra),
    packageManager: getPackageManagerSchema(extra),
  };
};

export const getModuleSchema = (extra: Record<string, any> = {}): Schema => {
  return {
    type: 'object',
    properties: getModuleSchemaProperties(extra),
  };
};

export const ModuleDefaultConfig = {
  language: Language.TS,
  packageManager: PackageManager.Pnpm,
};
