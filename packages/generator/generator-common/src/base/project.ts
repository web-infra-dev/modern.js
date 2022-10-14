import { Schema } from '@modern-js/codesmith-formily';
import { PackageManager, getPackageManagerSchema } from '../common';

export const getBaseSchema = (extra: Record<string, any> = {}): Schema => {
  return {
    type: 'object',
    properties: {
      packageManager: getPackageManagerSchema(extra),
    },
  };
};
export const BaseDefaultConfig = {
  packageManager: PackageManager.Pnpm,
};
