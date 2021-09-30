import { Schema } from '@modern-js/easy-form-core';
import {
  Language,
  LanguageSchema,
  PackageNameSchema,
  PackagePathSchema,
} from '@/common';

const GeneratorSchemaMap = {
  packageName: PackageNameSchema,
  packagePath: PackagePathSchema,
  language: LanguageSchema,
};

export const GeneratorSchema: Schema = {
  key: 'generator-generator',
  isObject: true,
  items: Object.values(GeneratorSchemaMap),
};

export const GeneratorDefaultConfig = {
  language: Language.TS,
};
