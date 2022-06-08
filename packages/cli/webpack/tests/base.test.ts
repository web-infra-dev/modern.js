import path from 'path';
import { NormalizedConfig } from '@modern-js/core';
import type WebpackChain from '@modern-js/utils/webpack-chain';
import { BaseWebpackConfig } from '../src/config/base';
import { JS_REGEX, TS_REGEX } from '../src/utils/constants';
import { mergeRegex } from '../src/utils/mergeRegex';
import { getWebpackUtils } from '../src/config/shared';
import { userConfig, mockNodeEnv } from './util';

describe('base webpack config', () => {
  const fixtures = path.resolve(__dirname, './fixtures');
  const appContext: any = {
    appDirectory: fixtures,
    internalDirectory: '/node_modules/.modern-js',
    srcDirectory: '/src',
    sharedDirectory: './shared',
    entrypoints: [
      {
        entryName: 'page-a',
        entry: path.resolve(fixtures, './demo/src/page-a/index.jsx'),
      },
    ],
    internalDirAlias: '@_modern_js_internal',
    internalSrcAlias: '@_modern_js_src',
  };

  class MyPlugin {
    name: string;

    constructor() {
      this.name = 'MyPlugin';
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    apply() {}
  }

  test(`default webpack config`, () => {
    userConfig.source.include = ['query-string'];

    const config = new BaseWebpackConfig(
      appContext,
      userConfig as any,
    ).config();

    // todo fix
    // expect(config.output).toEqual(
    //   expect.objectContaining({
    //     filename: 'static/js/[name].js',
    //     chunkFilename: 'static/js/[id].js',
    //     globalObject: 'window',
    //     publicPath: '/',
    //     assetModuleFilename: 'static/media/[name].[hash:8][ext]',
    //   }),
    // );

    expect(config.optimization?.splitChunks).toEqual({ chunks: 'all' });

    expect(config.cache).toHaveProperty('type', 'filesystem');

    expect(config.module.rules).toContainEqual(
      expect.objectContaining({
        oneOf: expect.arrayContaining([
          expect.objectContaining({
            include: expect.arrayContaining([expect.any(Function)]),
            test: mergeRegex(JS_REGEX, TS_REGEX),
          }),
        ]),
      }),
    );
  });

  test(`apply tools.webpackChain`, () => {
    const chainFunction: NormalizedConfig['tools']['webpackChain'] = (
      chain: WebpackChain,
      { env, webpack },
    ) => {
      chain.name('foo');
      expect(env).toEqual('test');
      expect(webpack.DefinePlugin).toBeTruthy();
    };

    const baseConfig = new BaseWebpackConfig(appContext, {
      ...userConfig,
      tools: {
        webpackChain: chainFunction,
      },
    } as any);

    baseConfig.applyToolsWebpackChain();

    expect(baseConfig.config().name).toEqual('foo');
  });

  test(`apply tools.webpack with legacy chain usage`, () => {
    const configFunction: NormalizedConfig['tools']['webpack'] = (
      config,
      { chain },
    ) => {
      chain.name('foo');
    };

    const baseConfig = new BaseWebpackConfig(appContext, {
      ...userConfig,
      tools: {
        webpack: configFunction,
      },
    } as any);

    expect(baseConfig.config().name).toEqual('foo');
  });

  test(`apply tools.webpack and modify the config object`, () => {
    const configFunction: NormalizedConfig['tools']['webpack'] = config => {
      config.name = 'foo';
    };

    const baseConfig = new BaseWebpackConfig(appContext, {
      ...userConfig,
      tools: {
        webpack: configFunction,
      },
    } as any);

    expect(baseConfig.config().name).toEqual('foo');
  });

  test(`apply tools.webpack and return a new config object`, () => {
    const configFunction: NormalizedConfig['tools']['webpack'] = config => {
      config.name = 'foo';
      return {
        name: 'bar',
      };
    };

    const baseConfig = new BaseWebpackConfig(appContext, {
      ...userConfig,
      tools: {
        webpack: configFunction,
      },
    } as any);

    expect(baseConfig.config().name).toEqual('bar');
  });

  test(`apply tools.webpack and using utils.addRules`, () => {
    const newRule = {
      test: /\.foo/,
      loader: 'foo-loader',
    };
    const configFunction: NormalizedConfig['tools']['webpack'] = (
      config,
      utils,
    ) => {
      utils.addRules([newRule]);
    };

    const baseConfig = new BaseWebpackConfig(appContext, {
      ...userConfig,
      tools: {
        webpack: configFunction,
      },
    } as any);

    expect(baseConfig.config().module.rules[0]).toEqual(newRule);
  });

  test(`apply tools.webpack and using utils.prependPlugins`, () => {
    const configFunction: NormalizedConfig['tools']['webpack'] = (
      config,
      utils,
    ) => {
      utils.prependPlugins([new MyPlugin()]);
    };

    const baseConfig = new BaseWebpackConfig(appContext, {
      ...userConfig,
      tools: {
        webpack: configFunction,
      },
    } as any);

    expect(baseConfig.config().plugins[0].constructor.name).toEqual('MyPlugin');
  });

  test(`apply tools.webpack and using utils.appendPlugins`, () => {
    const configFunction: NormalizedConfig['tools']['webpack'] = (
      config,
      utils,
    ) => {
      utils.appendPlugins([new MyPlugin()]);
    };

    const baseConfig = new BaseWebpackConfig(appContext, {
      ...userConfig,
      tools: {
        webpack: configFunction,
      },
    } as any);

    const { plugins } = baseConfig.config();
    expect(plugins[plugins.length - 1].constructor.name).toEqual('MyPlugin');
  });

  test(`apply tools.webpack and using utils.removePlugin`, () => {
    const configFunction: NormalizedConfig['tools']['webpack'] = (
      config,
      utils,
    ) => {
      utils.appendPlugins([new MyPlugin()]);
      utils.removePlugin('MyPlugin');
    };

    const baseConfig = new BaseWebpackConfig(appContext, {
      ...userConfig,
      tools: {
        webpack: configFunction,
      },
    } as any);

    const { plugins } = baseConfig.config();
    expect(
      plugins[plugins.length - 1].constructor.name === 'MyPlugin',
    ).toBeFalsy();
  });

  test('utils.appendPlugins should throw an error with incorrect argument type', () => {
    const utils = getWebpackUtils({ plugins: [] });

    expect(() => {
      utils.appendPlugins(new MyPlugin() as any);
    }).toThrowError();
  });

  test('utils.prependPlugins should throw an error with incorrect argument type', () => {
    const utils = getWebpackUtils({ plugins: [] });

    expect(() => {
      utils.prependPlugins(new MyPlugin() as any);
    }).toThrowError();
  });

  test('utils.addRules should throw an error with incorrect argument type', () => {
    const utils = getWebpackUtils({
      module: {
        rules: [],
      },
    });

    expect(() => {
      utils.addRules({} as any);
    }).toThrowError();
  });

  test(`should using output.assetPrefix as publicPath in dev`, () => {
    const restore = mockNodeEnv('development');

    const baseConfig = new BaseWebpackConfig(appContext, {
      ...userConfig,
      dev: {
        ...userConfig.dev,
        assetPrefix: 'https://dev/',
      },
      output: {
        ...userConfig.output,
        assetPrefix: 'https://prod/',
      },
    } as any);

    const { output } = baseConfig.config();
    expect(output.publicPath).toEqual('https://dev/');

    restore();
  });

  test(`should using dev.assetPrefix as publicPath in prod`, () => {
    const restore = mockNodeEnv('production');

    const baseConfig = new BaseWebpackConfig(appContext, {
      ...userConfig,
      dev: {
        ...userConfig.dev,
        assetPrefix: 'https://dev/',
      },
      output: {
        ...userConfig.output,
        assetPrefix: 'https://prod/',
      },
    } as any);

    const { output } = baseConfig.config();
    expect(output.publicPath).toEqual('https://prod/');

    restore();
  });
});
