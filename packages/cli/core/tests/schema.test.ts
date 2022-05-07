import { patchSchema, traverseSchema } from '../src/config/schema';

describe('patch schemas', () => {
  test('should add schema successfully', () => {
    const schema = patchSchema([
      {
        target: 'foo',
        schema: { type: 'string' },
      },
      {
        target: 'deploy.foo',
        schema: { type: 'number' },
      },
    ]);

    expect(schema.properties).toHaveProperty('foo');

    expect(schema.properties.deploy.properties).toHaveProperty('foo');
  });

  test('should throw error when node is undefined', () => {
    expect(() => {
      patchSchema([
        {
          target: 'deploy.a.foo',
          schema: { type: 'string' },
        },
      ]);
    }).toThrowError(/^add schema deploy\.a error$/);
  });

  test(`should throw error on empty target property`, () => {
    expect(() => {
      patchSchema([
        {
          target: '',
          schema: { type: 'object' },
        },
      ]);
    }).toThrowError('should return target property in plugin schema.');
  });

  test(`support schema array in one schema`, () => {
    const schema = patchSchema([
      [
        {
          target: 'foo',
          schema: { type: 'string' },
        },
        {
          target: 'tools.foo',
          schema: { type: 'number' },
        },
      ],
      {
        target: 'bar',
        schema: { type: 'string' },
      },
    ]);

    expect(schema.properties).toHaveProperty('foo');
    expect(schema.properties).toHaveProperty('bar');
    expect(schema.properties.tools.properties).toHaveProperty('foo');
  });
});

describe(`traverse schema`, () => {
  test(`should return all available keys of current schema`, () => {
    const schema = {
      type: 'object',
      properties: {
        source: {
          type: 'object',
          properties: { alias: { type: ['object', 'function'] } },
        },
        a: {
          type: 'object',
          properties: {
            b: {
              type: 'object',
              properties: { c: { type: 'object' } },
            },
            d: { type: 'string' },
          },
        },
        runtime: {
          type: 'object',
          properties: {
            router: { type: ['object', 'boolean'] },
            state: { type: ['object', 'boolean'] },
          },
        },
        runtimeByEntries: { patternProperties: { '^$': { type: 'string' } } },
        dev: { type: ['function', 'string'] },
      },
    };
    expect(traverseSchema(schema as any)).toEqual([
      'source.alias',
      'a.b.c',
      'a.d',
      'runtime.router',
      'runtime.state',
      'runtimeByEntries',
      'dev',
    ]);
  });
});
