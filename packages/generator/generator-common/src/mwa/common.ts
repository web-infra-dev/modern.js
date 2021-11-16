import { Schema } from '@modern-js/easy-form-core';
import { i18n, localeKeys } from '@/locale';
import { BooleanConfig, BooleanSchemas } from '@/common/boolean';
import { EnableLessSchema, EnableSassSchema } from '@/common/css';

export const mwaConfigWhenFunc = (values: Record<string, any>) =>
  values.needModifyMWAConfig === BooleanConfig.YES;
export enum RunWay {
  No = 'no',
  Electron = 'electron',
}

export const RunWaySchema: Schema = {
  key: 'runWay',
  type: ['string'],
  label: () => i18n.t(localeKeys.runWay.self),
  mutualExclusion: true,
  when: (_, extra) =>
    extra?.isEmptySrc === undefined ? true : Boolean(extra?.isEmptySrc),
  state: {
    value: RunWay.No,
  },
  items: Object.values(RunWay).map(runWay => ({
    key: runWay,
    label: () => i18n.t(localeKeys.runWay[runWay]),
  })),
};

export enum ClientRoute {
  SelfControlRoute = 'selfControlRoute',
  ConventionalRoute = 'conventionalRoute',
  No = 'no',
}

export const ClientRouteSchema: Schema = {
  key: 'clientRoute',
  type: ['string'],
  label: () => i18n.t(localeKeys.entry.clientRoute.self),
  mutualExclusion: true,
  when: mwaConfigWhenFunc,
  state: {
    value: ClientRoute.SelfControlRoute,
  },
  items: Object.values(ClientRoute).map(clientRoute => ({
    key: clientRoute,
    label: () => i18n.t(localeKeys.entry.clientRoute[clientRoute]),
  })),
};

export const DisableStateManagementSchema: Schema = {
  key: 'disableStateManagement',
  type: ['string'],
  label: () => i18n.t(localeKeys.entry.disableStateManagement),
  mutualExclusion: true,
  when: mwaConfigWhenFunc,
  state: {
    value: BooleanConfig.NO,
  },
  items: BooleanSchemas,
};

export const EnableMWALessSchema: Schema = {
  ...EnableLessSchema,
  when: mwaConfigWhenFunc,
};

export const EnableMWASassSchema: Schema = {
  ...EnableSassSchema,
  when: mwaConfigWhenFunc,
};

export const NeedModifyMWAConfigSchema: Schema = {
  key: 'needModifyMWAConfig',
  label: () => i18n.t(localeKeys.needModifyConfig.self),
  type: ['string'],
  mutualExclusion: true,
  state: {
    value: BooleanConfig.NO,
  },
  items: BooleanSchemas,
};

export enum Framework {
  Express = 'express',
  Koa = 'koa',
  Egg = 'egg',
  Nest = 'nest',
}

export const FrameworkSchema: Schema = {
  key: 'framework',
  type: ['string'],
  label: () => i18n.t(localeKeys.framework.self),
  mutualExclusion: true,
  items: Object.values(Framework).map(framework => ({
    key: framework,
    label: () => i18n.t(localeKeys.framework[framework]),
  })),
};
