import path from 'node:path';
import fse from '@modern-js/utils/fs-extra';
import type { RsbuildPlugin } from '@rsbuild/core';
import { logger } from '@rsbuild/core';
import { webpackRscLayerName } from '../common';
import { RscClientPlugin } from './rsc-client-plugin';
import { RscServerPlugin } from './rsc-server-plugin';
import { RspackRscClientPlugin } from './rspack-rsc-client-plugin';
import { RscServerPlugin as RspackRscServerPlugin } from './rspack-rsc-server-plugin';

const CSS_RULE_NAMES = ['less', 'css', 'scss', 'sass'];

const checkReactVersionAtLeast19 = async (appDir: string) => {
  const packageJsonPath = path.resolve(appDir, 'package.json');
  const packageJson = await fse.readJSON(packageJsonPath);

  if (!packageJson.dependencies) {
    return false;
  }

  const { dependencies } = packageJson;
  const reactVersion = dependencies.react;
  const reactDomVersion = dependencies['react-dom'];

  if (!reactVersion || !reactDomVersion) {
    return false;
  }

  const cleanVersion = (version: string) => version.replace(/[\^~]/g, '');
  const reactVersionParts = cleanVersion(reactVersion).split('.');
  const reactDomVersionParts = cleanVersion(reactDomVersion).split('.');

  const reactMajor = parseInt(reactVersionParts[0], 10);
  const reactDomMajor = parseInt(reactDomVersionParts[0], 10);

  if (Number.isNaN(reactMajor) || Number.isNaN(reactDomMajor)) {
    return false;
  }

  return reactMajor >= 19 && reactDomMajor >= 19;
};

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
        if (!(await checkReactVersionAtLeast19(appDir))) {
          logger.error(
            'Enable react server component, please make sure the react and react-dom versions are greater than or equal to 19.0.0',
          );
          process.exit(1);
        }

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
            .rule('server-module')
            .resource([/render[/\\].*[/\\]server[/\\]rsc/, /AppProxy/])
            .layer(webpackRscLayerName)
            .end();

          chain.module
            .rule(webpackRscLayerName)
            .issuerLayer(webpackRscLayerName)
            .resolve.conditionNames.add(webpackRscLayerName)
            .add('...');

          // TODO: Adapt to all modules
          chain.module
            .rule('rsc-common')
            .resource([/[/\\]node[/\\]storage/])
            .layer('rsc-common');
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
