import { Schema } from '@modern-js/easy-form-core';
import { i18n, localeKeys } from '../locale';
import { FrameworkSchema } from './common';
import { Framework } from '.';

export const ServerSchemas = [FrameworkSchema];
export const ServerSchema: Schema = {
  key: 'server',
  label: () => i18n.t(localeKeys.action.element.server),
  isObject: true,
  items: ServerSchemas,
};

export const MWADefaultServerConfig = {
  framework: Framework.Express,
};
