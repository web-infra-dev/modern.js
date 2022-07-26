import path from 'path';
import WebpackChain from '@modern-js/utils/webpack-chain';
import {
  NodeWebpackConfig,
  filterEntriesBySSRConfig,
} from '../src/config/node';
import { userConfig } from './util';

describe('node webpack config', () => {
  const fixtures = path.resolve(__dirname, './fixtures');
  const appContext = {
    internalDirectory: '/node_modules/.modern-js',
    srcDirectory: '/src',
    sharedDirectory: './shared',
    appDirectory: fixtures,
    entrypoints: [
      {
        entryName: 'page-a',
        entryPath: path.resolve(fixtures, './demo/src/page-a/index.jsx'),
      },
    ],
    internalDirAlias: '@_modern_js_internal',
    internalSrcAlias: '@_modern_js_src',
  };

  test(`webpack config target should be node`, () => {
    const config = new NodeWebpackConfig(
      appContext as any,
      userConfig as any,
    ).config();

    expect(config.target).toEqual('node');

    expect(config.devtool).toBe(false);

    expect(config.output?.filename).toBe('bundles/[name].js');

    expect(config.output?.libraryTarget).toBe('commonjs2');

    expect(config.optimization?.splitChunks).toBe(false);

    expect(config.optimization?.runtimeChunk).toBe(false);

    // TODO: css & babel
  });
});

describe('filterEntriesBySSRConfig', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    process.env.NODE_ENV = 'test';
  });

  const createChain = () => {
    const chain = new WebpackChain();
    chain.entry('foo').add('src/foo.js');
    chain.entry('bar').add('src/bar.js');
    return chain;
  };

  const createSingleChain = () => {
    const chain = new WebpackChain();
    chain.entry('foo').add('src/foo.js');
    return chain;
  };

  test('should return all entires when ssr is true', () => {
    const chain = createChain();
    filterEntriesBySSRConfig(chain, { ssr: true });
    expect(chain.toConfig().entry).toEqual({
      foo: ['src/foo.js'],
      bar: ['src/bar.js'],
    });
  });

  test('should allow to delete entry by ssrByEntries', () => {
    const chain = createChain();
    filterEntriesBySSRConfig(chain, {
      ssr: true,
      ssrByEntries: {
        bar: false,
      },
    });
    expect(chain.toConfig().entry).toEqual({
      foo: ['src/foo.js'],
    });
  });

  test('should allow to enable some entries by ssrByEntries', () => {
    const chain = createChain();
    filterEntriesBySSRConfig(chain, {
      ssrByEntries: {
        bar: true,
      },
    });
    expect(chain.toConfig().entry).toEqual({
      bar: ['src/bar.js'],
    });
  });

  test('should return all entries by when ssg is true', () => {
    const chain = createChain();
    filterEntriesBySSRConfig(
      chain,
      {
        ssr: false,
      },
      {
        ssg: true,
      },
    );
    expect(chain.toConfig().entry).toEqual({
      foo: ['src/foo.js'],
      bar: ['src/bar.js'],
    });
  });

  test('should return all entries by when ssg is function', () => {
    const chain = createChain();
    filterEntriesBySSRConfig(
      chain,
      {
        ssr: false,
      },
      {
        ssg: [
          () => {
            return {};
          },
        ] as any,
      },
    );
    expect(chain.toConfig().entry).toEqual({
      foo: ['src/foo.js'],
      bar: ['src/bar.js'],
    });
  });

  test('should allow to enable some entries by ssg', () => {
    const chain = createChain();
    filterEntriesBySSRConfig(
      chain,
      {
        ssr: false,
      },
      {
        ssg: {
          foo: true,
        },
      },
    );
    expect(chain.toConfig().entry).toEqual({
      foo: ['src/foo.js'],
    });
  });

  test('should not return entries when ssg is empty object and multi entries', () => {
    const chain = createChain();
    filterEntriesBySSRConfig(
      chain,
      {
        ssr: false,
      },
      {
        ssg: {},
      },
    );
    expect(chain.toConfig().entry).toBeUndefined();
  });

  test('should not return entry when ssg is exist and single entry', () => {
    const chain = createSingleChain();
    filterEntriesBySSRConfig(
      chain,
      {
        ssr: false,
      },
      {
        ssg: {},
      },
    );
    expect(chain.toConfig().entry).toEqual({
      foo: ['src/foo.js'],
    });
  });
});
