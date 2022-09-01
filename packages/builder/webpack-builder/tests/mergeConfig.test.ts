import { describe, expect, test } from 'vitest';
import { mergeBuilderConfig } from '../src/shared/utils';
import type { WebpackConfig } from '../src/types';

describe('mergeBuilderConfig', () => {
  test(`should set value when target value is not undefined `, () => {
    expect(
      mergeBuilderConfig([
        { source: { alias: {} } },
        { output: { disableMinimize: true } },
      ]),
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
    const config = mergeBuilderConfig([
      { source: { alias: {} } },
      { source: { alias: undefined } },
      { tools: { webpack: noop } },
      { tools: { webpack: undefined } },
    ]);
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
    const config = mergeBuilderConfig([
      { tools: { webpack: undefined } },
      { tools: { webpack: () => ({}) } },
    ]);
    expect(typeof config.tools!.webpack).toEqual('function');
  });

  test('should merge string and string[] correctly', async () => {
    expect(
      mergeBuilderConfig([
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
      ]),
    ).toEqual({
      source: {
        preEntry: ['./a.js', './b.js', './c.js'],
      },
    });
  });

  test('should deep merge object correctly', async () => {
    expect(
      mergeBuilderConfig([
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
      ]),
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
      mergeBuilderConfig([
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
      ]),
    ).toEqual({
      tools: {
        webpack: [{ devtool: 'eval' }, webpackFn],
      },
    });
  });
});
