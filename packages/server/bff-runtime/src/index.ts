// Node cannot detect named exports in farrow-schema's CommonJS barrel.
// Re-export its defining modules to preserve the same schema API in ESM and CJS.
export * from 'farrow-schema/dist/schema.js';
export type * from 'farrow-schema/dist/types.js';
export * from 'farrow-schema/dist/result.js';
export * from 'farrow-schema/dist/helper.js';

export { match, isHandler, isSchemaHandler } from './match';

export type { Handler, SchemaHandler } from './match';
export type { RequestSchema, TypeOfRequestSchema, InputType } from './request';
export type {
  HandleResult,
  HandleSuccess,
  InputValidationError,
  OutputValidationError,
} from './response';
