import { SomeJSONSchema } from '@modern-js/utils/ajv/json-schema';
import _ from '@modern-js/utils/lodash';
import { describe, expect, it } from 'vitest';
import { configSchema, ConfigValidator } from '@/config/validate';

const simpleObjectSchema = {
  properties: {
    propA: {
      type: 'number',
    },
    propB: {
      type: 'string',
    },
  },
  required: ['propA', 'propB'],
  type: 'object',
} as const;

const complexObjectSchema = {
  type: 'object',
  properties: {
    varBoolean: {
      anyOf: [{ enum: ['a', 'b', 'c', false, true] }, { type: 'number' }],
      default: false,
    },
    varInteger: {
      allOf: [{ enum: [123, 42] }, { type: 'number' }],
      default: 123,
    },
    varString: {
      anyOf: [{ enum: ['a', 'b', 'c', false, true] }, { type: 'number' }],
      default: 'a',
    },
  },
  required: ['varBoolean', 'varInteger'],
} as const;

/** Create validator without ajv instance just like a deserialized one. */
const createCustomValidator = _.memoize(async (schema: SomeJSONSchema) => {
  const validator = await ConfigValidator.create({ schema });
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error - we're testing this class.
  delete validator.ajv;
  return validator;
});

describe('ConfigValidator', async () => {
  const cases: {
    title: string;
    expected: boolean;
    schema?: SomeJSONSchema;
    value: any;
  }[] = [
    {
      title: 'empty config',
      expected: true,
      value: {},
    },
    {
      title: 'with wrong value',
      expected: false,
      value: { source: false },
    },
    {
      title: 'with additional method',
      expected: true,
      schema: simpleObjectSchema,
      value: {
        propA: 42,
        propB: 'hello',
        doNotInclude: () => undefined,
      },
    },
    {
      title: 'without property',
      expected: false,
      schema: simpleObjectSchema,
      value: {
        propA: 42,
      },
    },
    {
      title: 'with default value properties',
      expected: true,
      schema: complexObjectSchema as any,
      value: {
        varBoolean: true,
        varInteger: 42,
      },
    },
    {
      title: 'without anyOf schema',
      expected: false,
      schema: complexObjectSchema as any,
      value: {
        varBoolean: 'd',
        varInteger: 123,
      },
    },
    {
      title: 'source.globalVars with JSON type',
      expected: true,
      value: {
        source: {
          globalVars: {
            varBoolean: true,
            varInteger: 42,
            varString: 'a',
            varArray: [1, 2, 3, { foo: null, bar: 'baz' }],
          },
        },
      },
    },
  ];

  it.each(cases)('$title', async c => {
    const _validator = await createCustomValidator(
      (c.schema || configSchema) as any,
    );
    expect(await _validator.validate(c.value)).toBe(c.expected);
  });
});
