import { fs } from '@modern-js/utils';
import { NormalizedConfig } from '@modern-js/core';
import { IAppContext } from '@modern-js/types';
import {
  webpack,
  Configuration,
  WebpackConfigTarget,
} from '@modern-js/webpack';
import {
  printInspectResult,
  formatWebpackConfig,
  getTagByWebpackTarget,
} from '../../src/commands/inspect';

describe('inspect command', () => {
  const { DefinePlugin } = webpack;

  const webpackConfig: Configuration = {
    mode: 'development',
    plugins: [new DefinePlugin({ foo: 'bar' })],
  };

  const appContext = {
    metaName: '',
    appDirectory: __dirname,
    distDirectory: `${__dirname}/dist`,
    srcDirectory: `${__dirname}/src`,
    sharedDirectory: `${__dirname}/src/shared`,
    internalSrcAlias: '@_modern_js_src',
    internalDirAlias: '@_modern_js_internal',
    internalDirectory: `${__dirname}/node_modules/.modern-js`,
  } as IAppContext;

  const normalizedConfig = {
    source: {
      configDir: '/config',
    },
    output: {
      path: '/',
      jsPath: '/js',
      cssPath: '/css',
    },
  } as NormalizedConfig;

  test('should format webpack config correctly', () => {
    expect(formatWebpackConfig(webpackConfig)).toMatchSnapshot();
  });

  test('should get correct tag by webpack target', () => {
    expect(getTagByWebpackTarget(WebpackConfigTarget.CLIENT)).toEqual('client');
    expect(getTagByWebpackTarget(WebpackConfigTarget.NODE)).toEqual('ssr');
    expect(getTagByWebpackTarget(WebpackConfigTarget.MODERN)).toEqual('modern');
    expect(() => {
      getTagByWebpackTarget('foo' as any);
    }).toThrowError();
  });

  test('should log result in console', () => {
    const log = jest.fn();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(log);
    const fsSpy = jest.spyOn(fs, 'outputFileSync');

    printInspectResult(
      WebpackConfigTarget.CLIENT,
      appContext,
      normalizedConfig,
      {},
    );

    expect(log).toHaveBeenCalledTimes(1);
    logSpy.mockRestore();
    fsSpy.mockRestore();
  });

  test('should not log result in console when console option is false', () => {
    const log = jest.fn();
    const logSpy = jest.spyOn(console, 'log').mockImplementation(log);
    const fsSpy = jest.spyOn(fs, 'outputFileSync');

    printInspectResult(
      WebpackConfigTarget.CLIENT,
      appContext,
      normalizedConfig,
      {
        console: false,
      },
    );

    expect(log).toHaveBeenCalledTimes(0);
    logSpy.mockRestore();
    fsSpy.mockRestore();
  });
});
