import { Schema } from '@modern-js/easy-form-core';
import { PackageManager, PackageManagerSchema } from '@/common';

const MonorepoSchemaMap = {
  packageManager: PackageManagerSchema,
};
export const MonorepoSchema: Schema = {
  key: 'monorepo',
  isObject: true,
  items: Object.values(MonorepoSchemaMap),
};

export const MonorepoDefaultConfig = {
  packageManager: PackageManager.Pnpm,
};
