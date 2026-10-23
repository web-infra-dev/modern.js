import type { JsonSchema } from './types';

// Full JSON Schemas take precedence over property maps to avoid reinterpreting
// existing definitions (including schemas without an explicit object type).
const schemaKeywords = [
  '$schema',
  '$id',
  '$ref',
  '$defs',
  '$anchor',
  '$dynamicRef',
  '$dynamicAnchor',
  'type',
  'properties',
  'required',
  'additionalProperties',
  'patternProperties',
  'propertyNames',
  'dependentRequired',
  'dependentSchemas',
  'unevaluatedProperties',
  'minProperties',
  'maxProperties',
  'items',
  'prefixItems',
  'contains',
  'unevaluatedItems',
  'minItems',
  'maxItems',
  'uniqueItems',
  'minContains',
  'maxContains',
  'enum',
  'const',
  'anyOf',
  'oneOf',
  'allOf',
  'not',
  'if',
  'then',
  'else',
  'title',
  'description',
  'default',
  'examples',
  'deprecated',
  'readOnly',
  'writeOnly',
  'format',
  'pattern',
  'minLength',
  'maxLength',
  'contentEncoding',
  'contentMediaType',
  'contentSchema',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  '$comment',
  '$vocabulary',
  'definitions',
  'dependencies',
  'additionalItems',
] as const;

export type InputSchemaKeyword = (typeof schemaKeywords)[number];
const schemaKeywordSet = new Set<string>(schemaKeywords);

function isInputPropertyMap(schema: JsonSchema): boolean {
  const entries = Object.entries(schema);
  return (
    entries.length > 0 &&
    entries.every(
      ([key, value]) =>
        !schemaKeywordSet.has(key) &&
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value),
    )
  );
}

/** Expand shorthand once at normalization; nested fields use standard JSON Schema. */
export function normalizeInputSchema(
  schema: JsonSchema | undefined,
): JsonSchema | undefined {
  if (!schema || !isInputPropertyMap(schema)) return schema;
  const properties: JsonSchema = {};
  const required: string[] = [];
  for (const [name, value] of Object.entries(schema)) {
    const { optional, ...property } = value as JsonSchema;
    if (optional !== undefined && typeof optional !== 'boolean') {
      throw new Error(`Input property "${name}" optional must be a boolean`);
    }
    Object.defineProperty(properties, name, {
      value: property,
      enumerable: true,
    });
    if (optional !== true) required.push(name);
  }
  return { type: 'object', properties, required, additionalProperties: false };
}
