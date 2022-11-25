import { Schema } from '@modern-js/codesmith-formily';
import { i18n, localeKeys } from '../locale';

export enum Framework {
  Express = 'express',
  Koa = 'koa',
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

export const FrameworkAppendTypeContent: Record<Framework, string> = {
  [Framework.Express]: `/// <reference types='@modern-js/plugin-express/types' />`,
  [Framework.Koa]: `/// <reference types='@modern-js/plugin-koa/types' />`,
};
