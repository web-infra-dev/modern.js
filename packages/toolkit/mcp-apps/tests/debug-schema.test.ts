import { expect, it } from '@rstest/core';
import { schemaExample } from '../src/debug-schema';

it('creates editable arguments from required keys, defaults and enum values', () => {
  expect(
    schemaExample({
      type: 'object',
      required: ['name', 'count', 'settings'],
      properties: {
        name: { type: 'string' },
        count: { type: 'integer', minimum: 1 },
        mode: { type: 'string', default: 'all' },
        optional: { type: 'string' },
        settings: {
          type: 'object',
          properties: {
            active: { type: 'boolean' },
            color: { enum: ['red', 'blue'] },
          },
        },
      },
    }),
  ).toEqual({
    name: '',
    count: 1,
    mode: 'all',
    settings: { active: false, color: 'red' },
  });
});

it('handles empty inputs and schema examples', () => {
  expect(schemaExample({ type: 'object' })).toEqual({});
  expect(schemaExample({ examples: [{ title: 'A task' }] })).toEqual({
    title: 'A task',
  });
});
