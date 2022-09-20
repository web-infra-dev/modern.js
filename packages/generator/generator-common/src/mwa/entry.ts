import { Schema } from '@modern-js/easy-form-core';
import { i18n, localeKeys } from '../locale';
import { BooleanConfig } from '../common';
import {
  ClientRouteSchema,
  ClientRoute,
  NeedModifyMWAConfigSchema,
} from './common';

const EntryNameSchema: Schema = {
  key: 'name',
  type: ['string'],
  label: () => i18n.t(localeKeys.entry.name),
  state: {
    value: 'entry',
  },
  validate: (value: string) => {
    if (!value) {
      return {
        success: false,
        error: i18n.t(localeKeys.entry.no_empty),
      };
    }
    if (value === 'pages') {
      return {
        success: false,
        error: i18n.t(localeKeys.entry.no_pages),
      };
    }
    return {
      success: true,
    };
  },
  when: (_values: Record<string, any>, extra?: Record<string, unknown>) => {
    if (extra?.isEmptySrc) {
      return false;
    }
    return true;
  },
};

export const EntrySchemas = [
  EntryNameSchema,
  NeedModifyMWAConfigSchema,
  ClientRouteSchema,
];

export const EntrySchema: Schema = {
  key: 'entry',
  label: () => i18n.t(localeKeys.action.element.entry),
  isObject: true,
  items: EntrySchemas,
};

export const MWADefaultEntryConfig = {
  needModifyMWAConfig: BooleanConfig.NO,
  clientRoute: ClientRoute.SelfControlRoute,
};
