import { Schema } from '@modern-js/easy-form-core';
import {
  Language,
  LanguageSchema,
  PackageManager,
  PackageManagerSchema,
  PackageNameSchema,
  PackagePathSchema,
} from '@/common';

const GeneratorSchemaMap = {
  packageName: PackageNameSchema,
  packagePath: PackagePathSchema,
  PackageManager: PackageManagerSchema,
  language: LanguageSchema,
};

export const GeneratorSchema: Schema = {
  key: 'generator-generator',
  isObject: true,
  items: Object.values(GeneratorSchemaMap),
};

export const GeneratorDefaultConfig = {
  packageManager: PackageManager.Pnpm,
  language: Language.TS,
};
