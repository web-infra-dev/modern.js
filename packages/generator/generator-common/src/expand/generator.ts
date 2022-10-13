import { Schema } from '@modern-js/codesmith-formily';
import {
  Language,
  getLanguageSchema,
  PackageManager,
  getPackageManagerSchema,
  getPackageNameSchema,
  getPackagePathSchema,
} from '../common';

export const getGeneratorSchemaProperties = (
  extra: Record<string, any> = {},
): Schema['properties'] => {
  return {
    packageName: getPackageNameSchema(extra),
    packagePath: getPackagePathSchema(extra),
    packageManager: getPackageManagerSchema(extra),
    language: getLanguageSchema(extra),
  };
};

export const getGeneratorSchema = (extra: Record<string, any> = {}): Schema => {
  return {
    type: 'object',
    properties: getGeneratorSchemaProperties(extra),
  };
};

export const GeneratorDefaultConfig = {
  packageManager: PackageManager.Pnpm,
  language: Language.TS,
};
