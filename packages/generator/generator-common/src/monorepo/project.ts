import { Schema } from '@modern-js/easy-form-core';
import { PackageManager, PackageManagerSchema } from '../common';

export const MonorepoSchemas = [PackageManagerSchema];

export const MonorepoSchema: Schema = {
  key: 'monorepo',
  isObject: true,
  items: MonorepoSchemas,
};

export const MonorepoDefaultConfig = {
  packageManager: PackageManager.Pnpm,
};
