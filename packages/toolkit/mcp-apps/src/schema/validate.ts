import addFormats from 'ajv-formats';
import Ajv2020 from 'ajv/dist/2020.js';
import type { JsonSchema } from './types';

export function compileToolSchemas(input: JsonSchema, output?: JsonSchema) {
  // Compile per tool so schemas with the same $id cannot share stale validators.
  // Strict mode fails unsupported keywords instead of silently dropping constraints.
  const ajv = new Ajv2020({ strict: true, allErrors: true });
  addFormats(ajv);
  return {
    validateInput: ajv.compile(input),
    validateOutput: output ? ajv.compile(output) : undefined,
  };
}
