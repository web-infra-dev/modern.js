import { Schema } from '@modern-js/easy-form-core';
import { PackageManager, PackageManagerSchema } from '../common';

const MonorepoPackageManagerSchema = {
  ...PackageManagerSchema,
  items: (PackageManagerSchema.items as Schema[]).filter(
    item => item.key !== PackageManager.Npm,
  ),
};
export const MonorepoSchemas = [MonorepoPackageManagerSchema];

export const MonorepoSchema: Schema = {
  key: 'monorepo',
  isObject: true,
  items: MonorepoSchemas,
};

export const MonorepoDefaultConfig = {
  packageManager: PackageManager.Pnpm,
};
