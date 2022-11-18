import type { JSONSchemaType } from '@modern-js/utils/ajv/json-schema';

export * from './plugin';
export * from './config';
export * from './pluginAPI';
export * from './hooks';
export * from './context';

export interface PluginValidateSchema {
  target: string;
  schema: JSONSchemaType<any>;
}
