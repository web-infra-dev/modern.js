import path from 'path';
import { NormalizedConfig } from '@modern-js/core';
import type { WebpackChain } from '../src';
import { BaseWebpackConfig } from '../src/config/base';
import { JS_REGEX, TS_REGEX } from '../src/utils/constants';
import { mergeRegex } from '../src/utils/mergeRegex';
import { userConfig } from './util';

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
});
