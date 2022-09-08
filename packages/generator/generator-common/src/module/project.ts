<<<<<<< HEAD
import { Schema } from '@modern-js/codesmith-formily';
=======
import { Schema } from '@modern-js/easy-form-core';
>>>>>>> 4f77eb496 (feat: remove generator create project enable less and sass function (#1659))
import {
  Language,
  getLanguageSchema,
  PackageManager,
  getPackageManagerSchema,
  getPackageNameSchema,
  getPackagePathSchema,
} from '../common';

<<<<<<< HEAD
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
=======
export const ModuleSchemas = [
  PackageNameSchema,
  PackagePathSchema,
  LanguageSchema,
  PackageManagerSchema,
];

export const ModuleSchema: Schema = {
  key: 'module',
  isObject: true,
  items: ModuleSchemas,
>>>>>>> 4f77eb496 (feat: remove generator create project enable less and sass function (#1659))
};

export const ModuleDefaultConfig = {
  language: Language.TS,
  packageManager: PackageManager.Pnpm,
};
