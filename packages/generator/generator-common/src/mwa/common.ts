import { Schema } from '@modern-js/codesmith-formily';
import { i18n, localeKeys } from '../locale';
import { BooleanConfig, getBooleanSchemas } from '../common/boolean';

export enum ClientRoute {
  SelfControlRoute = 'selfControlRoute',
  ConventionalRoute = 'conventionalRoute',
}

export const getClientRouteSchema = (
  _extra: Record<string, any> = {},
): Schema => {
  return {
    type: 'string',
    title: i18n.t(localeKeys.entry.clientRoute.self),
    default: ClientRoute.SelfControlRoute,
    enum: Object.values(ClientRoute).map(clientRoute => ({
      value: clientRoute,
      label: i18n.t(localeKeys.entry.clientRoute[clientRoute]),
    })),
    'x-reactions': [
      {
        dependencies: ['needModifyMWAConfig'],
        fulfill: {
          state: {
            visible: `{{$deps[0]=== "${BooleanConfig.YES}"}}`,
          },
        },
      },
    ],
  };
};

export const getNeedModifyMWAConfigSchema = (
  _extra: Record<string, string> = {},
): Schema => {
  return {
    type: 'string',
    title: i18n.t(localeKeys.entry.needModifyConfig),
    default: BooleanConfig.NO,
    enum: getBooleanSchemas(),
  };
};

export enum Framework {
  Express = 'express',
  Koa = 'koa',
  Egg = 'egg',
  Nest = 'nest',
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
  [Framework.Egg]: `/// <reference types='@modern-js/plugin-egg/types' />`,
  [Framework.Nest]: `/// <reference types='@modern-js/plugin-nest/types' />`,
};
