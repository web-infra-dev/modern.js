import { expect, it } from '@rstest/core';
import { normalizeToolConfig } from '../src/definition';
import { normalizeInputSchema } from '../src/input-schema';
import { createMcpHandler } from '../src/server';

it('preserves full JSON Schema definitions, including schemas without type', () => {
  for (const schema of [
    {},
    { properties: { name: { type: 'string' } } },
    { $defs: { name: { type: 'string' } }, $ref: '#/$defs/name' },
    { anyOf: [{ type: 'string' }, { type: 'number' }] },
    { type: 'object', properties: { type: { type: 'string' } } },
  ]) {
    expect(normalizeInputSchema(schema)).toBe(schema);
  }
});

it('normalizes shorthand without mutating fields or nested constraints', () => {
  const address = Object.freeze({
    type: 'object',
    properties: { city: { type: 'string' } },
    required: ['city'],
    additionalProperties: false,
  });
  const count = Object.freeze({ type: 'integer', minimum: 1, optional: true });
  const schema = Object.freeze({ address, count });
  const tool = Object.freeze({ name: 'test', inputSchema: schema });
  const normalized = normalizeToolConfig(tool).inputSchema;
  expect(normalized).toEqual({
    type: 'object',
    properties: { address, count: { type: 'integer', minimum: 1 } },
    required: ['address'],
    additionalProperties: false,
  });
  expect(normalizeInputSchema(normalized)).toBe(normalized);
  expect(schema.count.optional).toBe(true);
});

it('rejects malformed optional markers and unsupported field constraints at setup', () => {
  const server = (inputSchema: Record<string, unknown>) => ({
    name: 'test',
    version: '1',
    remotes: [],
    tools: [{ name: 'test', inputSchema, handler: () => ({ content: [] }) }],
  });
  expect(() =>
    createMcpHandler(server({ count: { type: 'integer', optional: 'yes' } })),
  ).toThrow('optional must be a boolean');
  expect(() =>
    createMcpHandler(server({ count: { type: 'integer', typoKeyword: true } })),
  ).toThrow('unknown keyword');
});
