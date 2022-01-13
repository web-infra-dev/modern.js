import { Schema } from '@modern-js/easy-form-core';
import {
  Language,
  LanguageSchema,
  PackageManager,
  PackageManagerSchema,
  PackageNameSchema,
  PackagePathSchema,
} from '../common';

const GeneratorSchemas = [
  PackageNameSchema,
  PackagePathSchema,
  PackageManagerSchema,
  LanguageSchema,
];

export const GeneratorSchema: Schema = {
  key: 'generator-generator',
  isObject: true,
  items: Object.values(GeneratorSchemas),
};

export const GeneratorDefaultConfig = {
  packageManager: PackageManager.Pnpm,
  language: Language.TS,
};
