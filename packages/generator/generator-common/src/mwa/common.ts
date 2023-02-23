import { Schema } from '@modern-js/codesmith-formily';
import { i18n, localeKeys } from '../locale';

export enum Framework {
  Express = 'express',
  Koa = 'koa',
}

export enum BuildTools {
  Webpack = 'webpack',
  Rspack = 'rspack',
}

export const getFrameworkSchema = (
  _extra: Record<string, any> = {},
): Schema => {
  return {
    type: 'string',
    title: i18n.t(localeKeys.framework.self),
    enum: Object.values(Framework).map(framework => ({
      value: framework,
      label: i18n.t(localeKeys.framework[framework]),
    })),
  };
};

export const getBuildToolsSchema = (
  _extra: Record<string, any> = {},
): Schema => {
  return {
    type: 'string',
    title: i18n.t(localeKeys.buildTools.self),
    enum: Object.values(BuildTools).map(tool => ({
      value: tool,
      label: i18n.t(localeKeys.buildTools[tool]),
    })),
  };
};

export const FrameworkAppendTypeContent: Record<Framework, string> = {
  [Framework.Express]: `/// <reference types='@modern-js/plugin-express/types' />`,
  [Framework.Koa]: `/// <reference types='@modern-js/plugin-koa/types' />`,
};
