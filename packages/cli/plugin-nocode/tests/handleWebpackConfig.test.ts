import path from 'path';
import { BaseWebpackConfig } from '@modern-js/webpack';
import { defaultsConfig, IAppContext } from '@modern-js/core';
import { RuleSetRule } from 'webpack';
import { handleWebpackConfig } from '../src/compiler';

export const userConfig: any = {
  ...defaultsConfig,
};

const fixtures = path.resolve(__dirname, './');
const appContext = {
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

describe('plugin-nocode', () => {
  it('expect add style-loader to webpack config in nocode plugin', () => {
    try {
      userConfig._raw = userConfig;
      userConfig.source.include = ['query-string'];
      const config = new BaseWebpackConfig(
        appContext as IAppContext,
        userConfig,
      ).config();

      const hasStyleLoader = config?.module?.rules?.[1]?.oneOf.findIndex(
        (rule: RuleSetRule) => {
          return (
            Array.isArray(rule.use) &&
            typeof rule.use[0] === 'object' &&
            rule?.use?.[0]?.loader === 'style-loader'
          );
        },
      );
      expect(hasStyleLoader).toBeLessThan(0);
      handleWebpackConfig(config, {
        isDev: true,
        appDirectory: appContext.appDirectory,
        umdEntryFile: './',
      });

      const hasStyleLoaderAfterHandled =
        config?.module?.rules?.[1]?.oneOf.findIndex((rule: RuleSetRule) => {
          return (
            Array.isArray(rule.use) &&
            typeof rule.use[0] === 'object' &&
            rule.use[0].loader === 'style-loader'
          );
        });
      expect(hasStyleLoaderAfterHandled).toBeGreaterThanOrEqual(0);
    } catch (e) {
      console.error(e);
    }
  });
});
