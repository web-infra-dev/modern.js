import { Schema } from '@modern-js/easy-form-core';
import { i18n, localeKeys } from '@/locale';
import {
  BooleanConfig,
  getBooleanSchemas,
  Language,
  LanguageSchema,
  PackageManager,
  PackageManagerSchema,
  PackageNameSchema,
  PackagePathSchema,
} from '@/common';
import { EnableLessSchema, EnableSassSchema } from '@/common/css';

export enum ModuleContent {
  Library = 'library',
  Component = 'component',
  // Model = 'model',
  // Data = 'data',
}

export const ModuleContentText: Record<ModuleContent, () => string> = {
  [ModuleContent.Library]: () =>
    i18n.t(localeKeys.module.moduleContent.library),
  [ModuleContent.Component]: () =>
    i18n.t(localeKeys.module.moduleContent.component),
  // [ModuleContent.Model]: () => i18n.t(localeKeys.module.moduleContent.model),
  // [ModuleContent.Data]: () => i18n.t(localeKeys.module.moduleContent.data),
};

export enum LibType {
  Universal = 'universal',
  Browser = 'browser',
  NodeJs = 'nodejs',
}

export const LibTypeText: Record<LibType, () => string> = {
  [LibType.Universal]: () => i18n.t(localeKeys.module.libType.universal),
  [LibType.Browser]: () => i18n.t(localeKeys.module.libType.browser),
  [LibType.NodeJs]: () => i18n.t(localeKeys.module.libType.nodejs),
};

const ModuleContentSchema: Schema = {
  key: 'moduleContent',
  label: () => i18n.t(localeKeys.module.moduleContent.self),
  type: ['string'],
  mutualExclusion: true,
  items: Object.values(ModuleContent).map(moduleContent => ({
    key: moduleContent,
    label: ModuleContentText[moduleContent],
  })),
};

const LibTypeSchema: Schema = {
  key: 'libType',
  label: () => i18n.t(localeKeys.module.libType.self),
  type: ['string'],
  mutualExclusion: true,
  items: Object.values(LibType).map(libType => ({
    key: libType,
    label: LibTypeText[libType],
  })),
  when: values => values.moduleContent === ModuleContent.Library,
};

const NeedModifyModuleConfigSchema: Schema = {
  key: 'needModifyModuleConfig',
  label: () => i18n.t(localeKeys.needModifyConfig.self),
  type: ['string'],
  mutualExclusion: true,
  state: {
    value: BooleanConfig.NO,
  },

  items: getBooleanSchemas([EnableLessSchema, EnableSassSchema]),
};

const ModuleSchemaMap = {
  packageName: PackageNameSchema,
  packagePath: PackagePathSchema,
  language: LanguageSchema,
  packageManager: PackageManagerSchema,
  moduleContent: ModuleContentSchema,
  libType: LibTypeSchema,
  needModifyModuleConfig: NeedModifyModuleConfigSchema,
};

export const ModuleSchema: Schema = {
  key: 'module',
  isObject: true,
  items: Object.values(ModuleSchemaMap),
};

export const ModuleDefaultConfig = {
  language: Language.TS,
  packageManager: PackageManager.Pnpm,
  moduleContent: ModuleContent.Library,
  libType: LibType.Universal,
};
