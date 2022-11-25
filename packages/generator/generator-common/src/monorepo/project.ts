import { Schema } from '@modern-js/codesmith-formily';
import { PackageManager, getPackageManagerSchema } from '../common';

export const getMonorepoSchema = (extra: Record<string, any> = {}): Schema => {
  return {
    type: 'object',
    properties: {
      packageManager: getPackageManagerSchema(extra),
    },
  };
};

export const MonorepoDefaultConfig = {
  packageManager: PackageManager.Pnpm,
};
