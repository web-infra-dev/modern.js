import { Schema } from '@modern-js/easy-form-core';
import { i18n, localeKeys } from '@/locale';
import { BooleanConfig, getBooleanSchemas } from '@/common/boolean';
import { EnableLessSchema, EnableSassSchema } from '@/common/css';

export enum RunWay {
  No = 'no',
  Electron = 'electron',
}

export const RunWaySchema: Schema = {
  key: 'runWay',
  type: ['string'],
  label: () => i18n.t(localeKeys.runWay.self),
  mutualExclusion: true,
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

const ClientRouteSchema: Schema = {
  key: 'clientRoute',
  type: ['string'],
  label: () => i18n.t(localeKeys.entry.clientRoute.self),
  mutualExclusion: true,
  state: {
    value: ClientRoute.SelfControlRoute,
  },
  items: Object.values(ClientRoute).map(clientRoute => ({
    key: clientRoute,
    label: () => i18n.t(localeKeys.entry.clientRoute[clientRoute]),
  })),
};

const DisableStateManagementSchema: Schema = {
  key: 'disableStateManagement',
  type: ['string'],
  label: () => i18n.t(localeKeys.entry.disableStateManagement),
  mutualExclusion: true,
  state: {
    value: BooleanConfig.NO,
  },
  items: getBooleanSchemas(),
};

export const NeedModifyMWAConfigSchema: Schema = {
  key: 'needModifyMWAConfig',
  label: () => i18n.t(localeKeys.needModifyConfig.self),
  type: ['string'],
  mutualExclusion: true,
  state: {
    value: BooleanConfig.NO,
  },

  items: getBooleanSchemas([
    ClientRouteSchema,
    DisableStateManagementSchema,
    EnableLessSchema,
    EnableSassSchema,
  ]),
};
