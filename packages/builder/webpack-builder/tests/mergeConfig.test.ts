import { describe, expect, test, it } from 'vitest';
import { mergeBuilderConfig } from '../src/shared/utils';
import type { WebpackConfig } from '../src/types';

describe('mergeBuilderConfig', () => {
  it('should pick `false` to replace empty object', () => {
    expect(
      mergeBuilderConfig(
        { tools: { tsLoader: {} } },
        { tools: { tsLoader: false } },
      ),
    ).toEqual({
      tools: { tsLoader: false },
    });
  });

  test(`should set value when target value is not undefined `, () => {
    expect(
      mergeBuilderConfig(
        { source: { alias: {} } },
        { output: { disableMinimize: true } },
      ),
    ).toEqual({
      source: {
        alias: {},
      },
      output: {
        disableMinimize: true,
      },
    });
  });

  test(`should ignore undefined property`, () => {
    const noop = () => ({});
    const config = mergeBuilderConfig(
      { source: { alias: {} } },
      { source: { alias: undefined } },
      { tools: { webpack: noop } },
      { tools: { webpack: undefined } },
    );
    expect(config).toEqual({
      source: {
        alias: {},
      },
      tools: {
        webpack: noop,
      },
    });
  });

  test(`should keep single function value`, () => {
    const config = mergeBuilderConfig(
      { tools: { webpack: undefined } },
      { tools: { webpack: () => ({}) } },
    );
    expect(typeof config.tools.webpack).toEqual('function');
  });

  test('should merge string and string[] correctly', async () => {
    expect(
      mergeBuilderConfig(
        {
          source: {
            preEntry: './a.js',
          },
        },
        {
          source: {
            preEntry: ['./b.js', './c.js'],
          },
        },
      ),
    ).toEqual({
      source: {
        preEntry: ['./a.js', './b.js', './c.js'],
      },
    });
  });

  test('should deep merge object correctly', async () => {
    expect(
      mergeBuilderConfig(
        {
          output: {
            distPath: {
              root: 'foo',
              image: 'foo-image',
            },
          },
        },
        {
          output: {
            distPath: {
              root: 'bar',
              svg: 'bar-svg',
            },
          },
        },
      ),
    ).toEqual({
      output: {
        distPath: {
          root: 'bar',
          image: 'foo-image',
          svg: 'bar-svg',
        },
      },
    });
  });

  test('should merge function and object correctly', async () => {
    const webpackFn = (config: WebpackConfig) => {
      config.devtool = 'source-map';
    };

    expect(
      mergeBuilderConfig(
        {
          tools: {
            webpack: {
              devtool: 'eval',
            },
          },
        },
        {
          tools: { webpack: webpackFn },
        },
      ),
    ).toEqual({
      tools: {
        webpack: [{ devtool: 'eval' }, webpackFn],
      },
    });
  });

  it('should not effect source params', () => {
    const obj = { a: [1], b: [2], c: { test: [2] } };
    const other = { a: [3], b: [4], c: { test: [2] }, d: { test: [1] } };
    const other1 = { a: [4], b: [5], c: { test: [3] }, d: { test: [2] } };

    const res = mergeBuilderConfig<Record<string, any>>(obj, other, other1);

    expect(res).toEqual({
      a: [1, 3, 4],
      b: [2, 4, 5],
      c: { test: [2, 2, 3] },
      d: { test: [1, 2] },
    });
    expect(obj).toEqual({ a: [1], b: [2], c: { test: [2] } });
    expect(other).toEqual({
      a: [3],
      b: [4],
      c: { test: [2] },
      d: { test: [1] },
    });
    expect(other1).toEqual({
      a: [4],
      b: [5],
      c: { test: [3] },
      d: { test: [2] },
    });
  });
});
