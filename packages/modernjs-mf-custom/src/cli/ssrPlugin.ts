import path from 'path';
import fs from 'fs-extra';
import { ModuleFederationPlugin } from '@module-federation/enhanced/webpack';
import { ModuleFederationPlugin as RspackModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import UniverseEntryChunkTrackerPlugin from '@module-federation/node/universe-entry-chunk-tracker-plugin';
import logger from '../logger';
import { isDev } from './utils';
import { updateStatsAndManifest } from '@module-federation/rsbuild-plugin/utils';
import { isWebTarget, skipByTarget } from './utils';

import type {
  RsbuildPlugin,
  ModifyWebpackConfigFn,
  ModifyRspackConfigFn,
} from '@rsbuild/core';
import type { CliPluginFuture, AppTools } from '@modern-js/app-tools';
import type { InternalModernPluginOptions, PluginOptions } from '../types';

export function setEnv() {
  process.env['MF_DISABLE_EMIT_STATS'] = 'true';
  process.env['MF_SSR_PRJ'] = 'true';
}

export const CHAIN_MF_PLUGIN_ID = 'plugin-module-federation-server';

type ModifyBundlerConfiguration =
  | Parameters<ModifyWebpackConfigFn>[0]
  | Parameters<ModifyRspackConfigFn>[0];
type ModifyBundlerUtils =
  | Parameters<ModifyWebpackConfigFn>[1]
  | Parameters<ModifyRspackConfigFn>[1];

const mfSSRRsbuildPlugin = (
  pluginOptions: Required<InternalModernPluginOptions>,
): RsbuildPlugin => {
  return {
    name: '@modern-js/plugin-mf-post-config',
    pre: ['@modern-js/builder-plugin-ssr'],
    setup(api) {
      if (pluginOptions.csrConfig.getPublicPath) {
        return;
      }
      let csrOutputPath = '';
      let ssrOutputPath = '';
      let ssrEnv = '';

      api.modifyEnvironmentConfig((config, { name }) => {
        const target = config.output.target;
        if (skipByTarget(target)) {
          return config;
        }
        if (isWebTarget(target)) {
          csrOutputPath = config.output.distPath.root;
        } else {
          ssrOutputPath = config.output.distPath.root;
          ssrEnv = name;
        }
        return config;
      });

      const modifySSRPublicPath = (
        config: ModifyBundlerConfiguration,
        utils: ModifyBundlerUtils,
      ) => {
        if (ssrEnv !== utils.environment.name) {
          return config;
        }
        const userSSRConfig = pluginOptions.userConfig.ssr
          ? typeof pluginOptions.userConfig.ssr === 'object'
            ? pluginOptions.userConfig.ssr
            : {}
          : {};
        if (userSSRConfig.distOutputDir) {
          return;
        }
        config.output!.publicPath = `${config.output!.publicPath}${path.relative(csrOutputPath, ssrOutputPath)}/`;
        return config;
      };
      api.modifyWebpackConfig((config, utils) => {
        modifySSRPublicPath(config, utils);
        return config;
      });
      api.modifyRspackConfig((config, utils) => {
        modifySSRPublicPath(config, utils);
        return config;
      });
    },
  };
};

export const moduleFederationSSRPlugin = (
  pluginOptions: Required<InternalModernPluginOptions>,
): CliPluginFuture<AppTools> => ({
  name: '@modern-js/plugin-module-federation-ssr',
  pre: [
    '@modern-js/plugin-module-federation-config',
    '@modern-js/plugin-module-federation',
  ],
  setup: async (api) => {
    const modernjsConfig = api.getConfig();
    const enableSSR =
      pluginOptions.userConfig?.ssr ?? Boolean(modernjsConfig?.server?.ssr);

    if (!enableSSR) {
      return;
    }

    setEnv();

    api._internalRuntimePlugins(({ entrypoint, plugins }) => {
      const { fetchServerQuery } = pluginOptions;
      plugins.push({
        name: 'injectDataFetchFunction',
        path: '@module-federation/modern-js-rsc/ssr-inject-data-fetch-function-plugin',
        config: {
          fetchServerQuery,
        },
      });
      if (!isDev()) {
        return { entrypoint, plugins };
      }
      plugins.push({
        name: 'mfSSRDev',
        path: '@module-federation/modern-js-rsc/ssr-dev-plugin',
        config: {},
      });
      return { entrypoint, plugins };
    });

    if (pluginOptions.ssrConfig.remotes) {
      api._internalServerPlugins(({ plugins }) => {
        plugins.push({
          name: '@module-federation/modern-js/data-fetch-server-plugin',
          options: {},
        });

        return { plugins };
      });
    }

    api.modifyBundlerChain((chain) => {
      const target = chain.get('target');
      if (skipByTarget(target)) {
        return;
      }
      const bundlerType =
        api.getAppContext().bundlerType === 'rspack' ? 'rspack' : 'webpack';
      const MFPlugin =
        bundlerType === 'webpack'
          ? ModuleFederationPlugin
          : RspackModuleFederationPlugin;

      const isWeb = isWebTarget(target);

      if (!isWeb) {
        if (!chain.plugins.has(CHAIN_MF_PLUGIN_ID)) {
          chain
            .plugin(CHAIN_MF_PLUGIN_ID)
            .use(MFPlugin, [pluginOptions.ssrConfig])
            .init((Plugin: typeof MFPlugin, args) => {
              pluginOptions.nodePlugin = new Plugin(args[0]);
              return pluginOptions.nodePlugin;
            });
        }
      }

      if (!isWeb) {
        chain.target('async-node');
        if (isDev()) {
          chain
            .plugin('UniverseEntryChunkTrackerPlugin')
            .use(UniverseEntryChunkTrackerPlugin);
        }
        const userSSRConfig = pluginOptions.userConfig.ssr
          ? typeof pluginOptions.userConfig.ssr === 'object'
            ? pluginOptions.userConfig.ssr
            : {}
          : {};
        const publicPath = chain.output.get('publicPath');
        if (userSSRConfig.distOutputDir && publicPath) {
          chain.output.publicPath(
            `${publicPath}${userSSRConfig.distOutputDir}/`,
          );
        }
      }

      if (isDev() && isWeb) {
        chain.externals({
          '@module-federation/node/utils': 'NOT_USED_IN_BROWSER',
        });
      }
    });
    api.config(() => {
      return {
        builderPlugins: [mfSSRRsbuildPlugin(pluginOptions)],
        tools: {
          devServer: {
            before: [
              (req, res, next) => {
                if (!enableSSR) {
                  next();
                  return;
                }
                try {
                  if (
                    req.url?.includes('.json') &&
                    !req.url?.includes('hot-update')
                  ) {
                    const filepath = path.join(process.cwd(), `dist${req.url}`);
                    fs.statSync(filepath);
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader(
                      'Access-Control-Allow-Methods',
                      'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                    );
                    res.setHeader('Access-Control-Allow-Headers', '*');
                    fs.createReadStream(filepath).pipe(res);
                  } else {
                    next();
                  }
                } catch (err) {
                  logger.debug(err);
                  next();
                }
              },
            ],
          },
        },
      };
    });
    api.onAfterBuild(() => {
      const { nodePlugin, browserPlugin, distOutputDir } = pluginOptions;
      updateStatsAndManifest(nodePlugin, browserPlugin, distOutputDir);
    });
    api.onDevCompileDone(() => {
      // 热更后修改 manifest
      const { nodePlugin, browserPlugin, distOutputDir } = pluginOptions;
      updateStatsAndManifest(nodePlugin, browserPlugin, distOutputDir);
    });
  },
});

export default moduleFederationSSRPlugin;
