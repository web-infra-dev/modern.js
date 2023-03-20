import { Schema } from '@modern-js/codesmith-formily';
import {
  getPackageNameSchema,
  getPackagePathSchema,
  PackageManager,
  getPackageManagerSchema,
} from '../common';

export const getDocSchemaProperties = (
  extra: Record<string, any>,
): Schema['properties'] => {
  return {
    packageName: getPackageNameSchema(extra),
    packagePath: getPackagePathSchema(extra),
    packageManager: getPackageManagerSchema(extra),
  };
};

export const getDocSchema = (extra: Record<string, any> = {}): Schema => {
  return {
    type: 'object',
    properties: getDocSchemaProperties(extra),
  };
};

export const DocDefaultConfig = {
  packageManager: PackageManager.Pnpm,
};
