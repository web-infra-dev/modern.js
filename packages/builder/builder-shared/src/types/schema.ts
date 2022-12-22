type SchemaTypeItem =
  | 'number'
  | 'integer'
  | 'string'
  | 'boolean'
  | 'array'
  | 'object'
  | 'null';

type SchemaTypeOfItem =
  | 'undefined'
  | 'string'
  | 'number'
  | 'object'
  | 'boolean'
  | 'function'
  | 'symbol';

type SchemaInstanceofItem =
  | 'Array'
  | 'Object'
  | 'Function'
  | 'String'
  | 'Number'
  | 'Date'
  | 'RegExp'
  | 'Promise';

// The "JSONSchemaType" of ajv can not handle complex type,
// so we defined a new type to provide some basic check.
export type ConfigSchema<T> = {
  type: 'object';
  properties: Record<
    keyof T,
    | {
        type: SchemaTypeItem | SchemaTypeItem[];
      }
    | {
        typeof: SchemaTypeOfItem | SchemaTypeOfItem[];
      }
    | {
        instanceof: SchemaInstanceofItem | SchemaInstanceofItem[];
      }
  >;
};
