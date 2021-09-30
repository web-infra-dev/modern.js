import { Schema } from '@modern-js/easy-form-core';
import { NeedModifyMWAConfigSchema } from './common';
import { i18n, localeKeys } from '@/locale';

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
        message: i18n.t(localeKeys.entry.no_empty),
      };
    }
    if (value === 'pages') {
      return {
        success: false,
        message: i18n.t(localeKeys.entry.no_pages),
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

const EntrySchemaMap: Record<string, Schema> = {
  name: EntryNameSchema,
  needModifyEntryConfig: NeedModifyMWAConfigSchema,
};

export const EntrySchema: Schema = {
  key: 'entry',
  label: () => i18n.t(localeKeys.action.element.entry),
  isObject: true,
  items: Object.values(EntrySchemaMap),
};
