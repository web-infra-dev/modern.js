import { Schema } from '@modern-js/easy-form-core';
import { PackageManager, PackageManagerSchema } from '../common';

export const BaseSchemas = [PackageManagerSchema];

export const BaseSchema: Schema = {
  key: 'base',
  isObject: true,
  items: BaseSchemas,
};

export const BaseDefaultConfig = {
  packageManager: PackageManager.Pnpm,
};
