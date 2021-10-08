import { Schema } from '@modern-js/easy-form-core';
import { i18n, localeKeys } from '../locale';
import { FrameworkSchema } from './common';

const ServerSchemaMap = {
  framework: FrameworkSchema,
};
export const ServerSchema: Schema = {
  key: 'server',
  label: () => i18n.t(localeKeys.action.element.server),
  isObject: true,
  items: Object.values(ServerSchemaMap),
};
