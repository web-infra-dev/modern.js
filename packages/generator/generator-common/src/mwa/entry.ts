import { Schema } from '@modern-js/codesmith-formily';
import { i18n, localeKeys } from '../locale';
import { BooleanConfig } from '../common';
import {
  getClientRouteSchema,
  ClientRoute,
  getNeedModifyMWAConfigSchema,
} from './common';

export const getEntryNameSchema = (extra: Record<string, any> = {}): Schema => {
  return {
    type: 'string',
    title: i18n.t(localeKeys.entry.name),
    default: 'entry',
    'x-validate': (value: string) => {
      if (!value) {
        return i18n.t(localeKeys.entry.no_empty);
      }
      if (value === 'pages') {
        return i18n.t(localeKeys.entry.no_pages);
      }
      return '';
    },
    'x-reactions': [
      {
        dependencies: [],
        fulfill: {
          state: {
            visible: !extra?.isEmptySrc,
          },
        },
      },
    ],
  };
};

export const getEntrySchemaProperties = (
  extra: Record<string, any>,
): Schema['properties'] => {
  return {
    name: getEntryNameSchema(extra),
    needModifyMWAConfig: getNeedModifyMWAConfigSchema(extra),
    clientRoute: getClientRouteSchema(extra),
  };
};

export const getEntrySchema = (extra: Record<string, any>): Schema => {
  return {
    type: 'object',
    properties: getEntrySchemaProperties(extra),
  };
};

export const MWADefaultEntryConfig = {
  needModifyMWAConfig: BooleanConfig.NO,
  clientRoute: ClientRoute.SelfControlRoute,
};
