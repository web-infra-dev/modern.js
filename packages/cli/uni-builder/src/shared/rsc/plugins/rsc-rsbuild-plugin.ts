import type { RsbuildPlugin } from '@rsbuild/core';
import { webpackRscLayerName } from '../common';
import { RscClientPlugin } from './rsc-client-plugin';
import { RscServerPlugin } from './rsc-server-plugin';

const CSS_RULE_NAMES = ['less', 'css', 'scss', 'sass'];

export const rscRsbuildPlugin = (): RsbuildPlugin => ({
  name: 'uni-builder:rsc-rsbuild-plugin',

  setup(api) {
    api.modifyBundlerChain({
      handler: async (chain, { isServer, CHAIN_ID, environment }) => {
        const styles = new Set<string>();
        const babelHandler = () => {
          const originalJsRule = chain.module.rules.get(CHAIN_ID.RULE.JS);
          if (originalJsRule) {
            const babelLoaderOptions = chain.module
              .rule(CHAIN_ID.RULE.JS)
              .use(CHAIN_ID.USE.BABEL)
              .get('options');
            chain.module.rule(CHAIN_ID.RULE.JS).uses.delete(CHAIN_ID.USE.BABEL);

            const babelLoaderPath = require.resolve('babel-loader');
            chain.module
              .rule(CHAIN_ID.RULE.JS)
              .oneOf('rsc-server')
              .issuerLayer(webpackRscLayerName)
              .use('rsc-server-loader')
              .loader(require.resolve('../rsc-server-loader'))
              .options({
                runtimeExport: '@modern-js/render/rsc',
              })
              .end()
              .use(CHAIN_ID.USE.BABEL)
              .loader(babelLoaderPath)
              .options(babelLoaderOptions)
              .end()
              .end()
              .oneOf('rsc-ssr')
              .use('rsc-ssr-loader')
              .loader(require.resolve('../rsc-ssr-loader'))
              .end()
              .use(CHAIN_ID.USE.BABEL)
              .loader(babelLoaderPath)
              .options(babelLoaderOptions)
              .end();
          }
        };

        const layerHandler = () => {
          chain.experiments({
            ...chain.experiments,
            layers: true,
          });

          chain.module
            .rule(webpackRscLayerName)
            .issuerLayer(webpackRscLayerName)
            .resolve.conditionNames.merge([webpackRscLayerName, '...']);

          chain.module
            .rule('server-module')
            .resource([/render\/.*\/server\/rsc/, /AppProxy/])
            .layer(webpackRscLayerName)
            .end();
        };

        const flightCssHandler = () => {
          CSS_RULE_NAMES.forEach(ruleName => {
            const rule = chain.module.rules.get(ruleName);
            if (rule) {
              chain.module
                .rule(ruleName)
                .use('custom-loader')
                .before('ignore-css')
                .loader(require.resolve('../rsc-css-loader'));
            }
          });
        };

        const addServerRscPlugin = () => {
          chain.plugin('rsc-server-plugin').use(RscServerPlugin, [{ styles }]);
        };

        const addRscClientLoader = () => {
          chain.module
            .rule('js')
            .use('rsc-client-loader')
            .loader(require.resolve('../rsc-client-loader'))
            .before('babel')
            .end();
        };

        const addRscClientPlugin = () => {
          chain.plugin('rsc-client-plugin').use(RscClientPlugin, [{ styles }]);
        };

        if (isServer) {
          chain.name('server');
          layerHandler();
          flightCssHandler();
          babelHandler();
          addServerRscPlugin();
        } else {
          chain.name('client');
          chain.dependencies(['server']);
          addRscClientLoader();
          addRscClientPlugin();
        }
      },
      order: 'post',
    });
  },
});
