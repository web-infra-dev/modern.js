import type { RsbuildPlugin } from '@rsbuild/core';
import { webpackRscLayerName } from '../common';
import { RscClientPlugin } from './rsc-client-plugin';
import { RscServerPlugin } from './rsc-server-plugin';
import { RspackRscClientPlugin } from './rspack-rsc-client-plugin';
import { RscServerPlugin as RspackRscServerPlugin } from './rspack-rsc-server-plugin';

const CSS_RULE_NAMES = ['less', 'css', 'scss', 'sass'];

export const rsbuildRscPlugin = ({
  appDir,
  isRspack = true,
  rscClientRuntimePath,
  rscServerRuntimePath,
}: {
  appDir: string;
  isRspack?: boolean;
  rscClientRuntimePath?: string;
  rscServerRuntimePath?: string;
}): RsbuildPlugin => ({
  name: 'uni-builder:rsc-rsbuild-plugin',

  setup(api) {
    api.modifyBundlerChain({
      handler: async (chain, { isServer, CHAIN_ID }) => {
        const entryPath2Name = new Map<string, string>();

        for (const [name, entry] of Object.entries(
          chain.entryPoints.entries(),
        )) {
          entry.values().forEach(value => {
            entryPath2Name.set(value as unknown as string, name);
          });
        }
        const jsHandler = () => {
          const originalJsRule = chain.module.rules.get(CHAIN_ID.RULE.JS);
          const useBabel = originalJsRule.uses.has(CHAIN_ID.USE.BABEL);
          const JSRule = useBabel ? CHAIN_ID.USE.BABEL : CHAIN_ID.USE.SWC;

          if (originalJsRule) {
            const jsLoaderOptions = originalJsRule.use(JSRule).get('options');
            const jsLoaderPath = originalJsRule.use(JSRule).get('loader');
            originalJsRule.uses.delete(JSRule);

            chain.module
              .rule(CHAIN_ID.RULE.JS)
              .oneOf('rsc-server')
              .issuerLayer(webpackRscLayerName)
              .use('rsc-server-loader')
              .loader(require.resolve('../rsc-server-loader'))
              .options({
                entryPath2Name,
                appDir,
                runtimePath: rscServerRuntimePath,
              })
              .end()
              .use(JSRule)
              .loader(jsLoaderPath)
              .options(jsLoaderOptions)
              .end()
              .end()
              .oneOf('rsc-ssr')
              .use('rsc-ssr-loader')
              .loader(require.resolve('../rsc-ssr-loader'))
              .options({
                entryPath2Name,
              })
              .end()
              .use(JSRule)
              .loader(jsLoaderPath)
              .options(jsLoaderOptions)
              .end()
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
            .resolve.conditionNames.add(webpackRscLayerName)
            .add('...');

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
          const ServerPlugin = isRspack
            ? RspackRscServerPlugin
            : RscServerPlugin;
          chain.plugin('rsc-server-plugin').use(ServerPlugin, [
            {
              entryPath2Name,
            },
          ]);
        };

        const addRscClientLoader = () => {
          chain.module
            .rule('js')
            .use('rsc-client-loader')
            .loader(require.resolve('../rsc-client-loader'))
            .before('babel')
            .options({
              callServerImport: rscClientRuntimePath,
              registerImport: rscClientRuntimePath,
            })
            .end();
        };

        const addRscClientPlugin = () => {
          const ClientPlugin = isRspack
            ? RspackRscClientPlugin
            : RscClientPlugin;
          chain.plugin('rsc-client-plugin').use(ClientPlugin);
        };

        const configureRuntimeChunk = () => {
          chain.optimization.runtimeChunk({
            name: entrypoint => `runtime-${entrypoint.name}`,
          });
        };

        if (isServer) {
          chain.name('server');
          layerHandler();
          flightCssHandler();
          jsHandler();
          addServerRscPlugin();
        } else {
          chain.name('client');
          chain.dependencies(['server']);
          addRscClientLoader();
          addRscClientPlugin();
          configureRuntimeChunk();
        }
      },
      order: 'post',
    });
  },
});
