import { Schema } from '@modern-js/easy-form-core';
import {
  Language,
  LanguageSchema,
  PackageManager,
  PackageManagerSchema,
  PackageNameSchema,
  PackagePathSchema,
} from '../common';

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
};

export const ModuleDefaultConfig = {
  language: Language.TS,
  packageManager: PackageManager.Pnpm,
};
