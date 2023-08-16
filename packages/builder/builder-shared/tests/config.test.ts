import { expect, it, describe } from 'vitest';
import webpack from 'webpack';
import {
  getExtensions,
  stringifyConfig,
  getMetaTags,
  pickBuilderConfig,
} from '../src/config';

it('should get default extensions correctly', async () => {
  expect(getExtensions()).toEqual(['.js', '.jsx', '.mjs', '.json']);
});

it('should get extensions with ts', async () => {
  expect(
    getExtensions({
      isTsProject: true,
    }),
  ).toEqual(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json']);
});

it('should get extensions with prefix', async () => {
  expect(
    getExtensions({
      resolveExtensionPrefix: '.web',
    }),
  ).toEqual([
    '.web.js',
    '.js',
    '.web.jsx',
    '.jsx',
    '.web.mjs',
    '.mjs',
    '.web.json',
    '.json',
  ]);
});

it('should get extensions with prefix by target', async () => {
  expect(
    getExtensions({
      target: 'node',
      resolveExtensionPrefix: {
        web: '.web',
        node: '.node',
      },
    }),
  ).toEqual([
    '.node.js',
    '.js',
    '.node.jsx',
    '.jsx',
    '.node.mjs',
    '.mjs',
    '.node.json',
    '.json',
  ]);
});

describe('stringifyConfig', () => {
  it('should stringify webpack config correctly', async () => {
    const { DefinePlugin } = webpack;
    const webpackConfig = {
      mode: 'development',
      plugins: [new DefinePlugin({ foo: 'bar' })],
    };

    expect(await stringifyConfig(webpackConfig)).toMatchSnapshot();
  });

  it('should stringify webpack config with verbose option correctly', async () => {
    const { DefinePlugin } = webpack;
    const webpackConfig = {
      mode: 'development',
      plugins: [
        new DefinePlugin({
          foo: 'bar',
          baz() {
            const a = 1;
            return a;
          },
        }),
      ],
    };

    expect(await stringifyConfig(webpackConfig, true)).toMatchSnapshot();
  });

  it('should stringify builder config correctly', async () => {
    const builderConfig = {
      tools: {
        webpackChain(chain: any) {
          chain.devtool('eval');
        },
      },
    };

    expect(await stringifyConfig(builderConfig)).toMatchSnapshot();
  });

  it('shold meta generate correctly', async () => {
    const builderConfig = {
      html: {
        meta: { description: 'This is basic meta', bar: 'bar', foo: 'foo' },
        metaByEntries: {
          entry1: {
            description: 'This is about page',
          },
        },
      },
      output: {} as any,
    };

    const defaultEntry = await getMetaTags('', builderConfig);
    expect(defaultEntry).toMatchSnapshot();

    const entry1 = await getMetaTags('entry1', builderConfig);
    expect(entry1).toMatchSnapshot();
  });
});

describe('pickBuilderConfig', () => {
  it('should pick correct keys from builder config', () => {
    const builderConfig = {
      dev: {},
      html: {},
      tools: {},
      source: {},
      output: {},
      security: {},
      performance: {},
      experiments: {},
      extraKey: 'extraValue',
    };

    const result = pickBuilderConfig(builderConfig);

    expect(result).toEqual({
      dev: {},
      html: {},
      tools: {},
      source: {},
      output: {},
      security: {},
      performance: {},
      experiments: {},
    });
  });

  it('should return empty object when builder config is empty', () => {
    const builderConfig = {};
    const result = pickBuilderConfig(builderConfig);
    expect(result).toEqual({});
  });
});
