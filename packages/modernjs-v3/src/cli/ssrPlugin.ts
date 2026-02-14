import path from 'path';
import {
  ModuleFederationPlugin as RspackModuleFederationPlugin,
  TreeShakingSharedPlugin as RspackTreeShakingSharedPlugin,
} from '@module-federation/enhanced/rspack';
import UniverseEntryChunkTrackerPlugin from '@module-federation/node/universe-entry-chunk-tracker-plugin';
import {
  type StatsAssetResource,
  updateStatsAndManifest,
} from '@module-federation/rsbuild-plugin/utils';
import {
  ManifestFileName,
  StatsFileName,
  simpleJoinRemoteEntry,
} from '@module-federation/sdk';
import type { moduleFederationPlugin } from '@module-federation/sdk';
import fs from 'fs-extra';
import logger from '../logger';
import { isDev } from './utils';
import { isWebTarget, skipByTarget } from './utils';

import type { AppTools, CliPlugin } from '@modern-js/app-tools';
import type { ModifyRspackConfigFn, RsbuildPlugin } from '@rsbuild/core';
import type {
  AssetFileNames,
  InternalModernPluginOptions,
  PluginOptions,
} from '../types';

export function setEnv() {
  process.env.MF_SSR_PRJ = 'true';
}

export const CHAIN_MF_PLUGIN_ID = 'plugin-module-federation-server';

function getManifestAssetFileNames(
  manifestOption?: moduleFederationPlugin.ModuleFederationPluginOptions['manifest'],
): AssetFileNames {
  if (!manifestOption) {
    return {
      statsFileName: StatsFileName,
      manifestFileName: ManifestFileName,
    };
  }

  const JSON_EXT = '.json';
  const filePath =
    typeof manifestOption === 'boolean' ? '' : manifestOption.filePath || '';
  const baseFileName =
    typeof manifestOption === 'boolean' ? '' : manifestOption.fileName || '';
  const ensureExt = (name: string) =>
    name.endsWith(JSON_EXT) ? name : `${name}${JSON_EXT}`;
  const withSuffix = (name: string, suffix: string) =>
    name.replace(JSON_EXT, `${suffix}${JSON_EXT}`);
  const manifestFileName = baseFileName
    ? ensureExt(baseFileName)
    : ManifestFileName;
  const statsFileName = baseFileName
    ? withSuffix(manifestFileName, '-stats')
    : StatsFileName;

  return {
    statsFileName: simpleJoinRemoteEntry(filePath, statsFileName),
    manifestFileName: simpleJoinRemoteEntry(filePath, manifestFileName),
  };
}

type ModifyBundlerConfiguration = Parameters<ModifyRspackConfigFn>[0];
type ModifyBundlerUtils = Parameters<ModifyRspackConfigFn>[1];

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
      let csrEnv = '';

      const browserAssetFileNames =
        pluginOptions.assetFileNames.browser ||
        getManifestAssetFileNames(pluginOptions.csrConfig?.manifest);
      const nodeAssetFileNames =
        pluginOptions.assetFileNames?.node ||
        getManifestAssetFileNames(pluginOptions.ssrConfig?.manifest);

      const collectAssets = (
        assets: Record<string, { source: () => string | Buffer }>,
        fileNames: { statsFileName: string; manifestFileName: string },
        tag: 'browser' | 'node',
      ): StatsAssetResource | undefined => {
        const statsAsset = assets[fileNames.statsFileName];
        const manifestAsset = assets[fileNames.manifestFileName];

        if (!statsAsset || !manifestAsset) {
          return undefined;
        }

        try {
          const statsRaw = statsAsset.source();
          const manifestRaw = manifestAsset.source();
          const statsContent =
            typeof statsRaw === 'string' ? statsRaw : statsRaw.toString();
          const manifestContent =
            typeof manifestRaw === 'string'
              ? manifestRaw
              : manifestRaw.toString();

          return {
            stats: {
              data: JSON.parse(statsContent),
              filename: fileNames.statsFileName,
            },
            manifest: {
              data: JSON.parse(manifestContent),
              filename: fileNames.manifestFileName,
            },
          };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          logger.error(`Failed to parse ${tag} manifest assets: ${message}`);
          return undefined;
        }
      };

      api.modifyEnvironmentConfig((config, { name }) => {
        const target = config.output.target;
        if (skipByTarget(target)) {
          return config;
        }
        if (isWebTarget(target)) {
          csrOutputPath = config.output.distPath.root;
          csrEnv = name;
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
        if (!userSSRConfig.distOutputDir) {
          return;
        }
        config.output!.publicPath = `${config.output!.publicPath}${path.relative(csrOutputPath, ssrOutputPath)}/`;
        return config;
      };
      api.modifyRspackConfig((config, utils) => {
        modifySSRPublicPath(config, utils);
        return config;
      });

      api.processAssets(
        { stage: 'report' },
        ({ assets, environment: envContext }) => {
          const envName = envContext.name;

          if (
            pluginOptions.csrConfig?.manifest !== false &&
            csrEnv &&
            envName === csrEnv
          ) {
            const browserAssets = collectAssets(
              assets,
              browserAssetFileNames,
              'browser',
            );
            if (browserAssets) {
              pluginOptions.assetResources.browser = browserAssets;
            }
          }

          if (
            pluginOptions.ssrConfig?.manifest !== false &&
            ssrEnv &&
            envName === ssrEnv
          ) {
            const nodeAssets = collectAssets(
              assets,
              nodeAssetFileNames,
              'node',
            );
            if (nodeAssets) {
              pluginOptions.assetResources.node = nodeAssets;
            }
          }
        },
      );
    },
  };
};

export const moduleFederationSSRPlugin = (
  pluginOptions: Required<InternalModernPluginOptions>,
): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-module-federation-ssr',
  pre: [
    '@modern-js/plugin-module-federation-config',
    '@modern-js/plugin-module-federation',
  ],
  setup: async api => {
    const modernjsConfig = api.getConfig();
    const enableSSR =
      pluginOptions.userConfig?.ssr ?? Boolean(modernjsConfig?.server?.ssr);
    const enableRsc = Boolean(modernjsConfig?.server?.rsc);
    const { secondarySharedTreeShaking } = pluginOptions;
    if (!enableSSR) {
      return;
    }

    setEnv();

    api._internalRuntimePlugins(({ entrypoint, plugins }) => {
      if (secondarySharedTreeShaking) {
        return { entrypoint, plugins };
      }
      const { fetchServerQuery } = pluginOptions;
      plugins.push({
        name: 'injectDataFetchFunction',
        path: '@module-federation/modern-js-v3/ssr-inject-data-fetch-function-plugin',
        config: {
          fetchServerQuery,
        },
      });
      if (!isDev()) {
        return { entrypoint, plugins };
      }
      plugins.push({
        name: 'mfSSRDev',
        path: '@module-federation/modern-js-v3/ssr-dev-plugin',
        config: {},
      });
      return { entrypoint, plugins };
    });

    if (pluginOptions.ssrConfig.remotes) {
      api._internalServerPlugins(({ plugins }) => {
        plugins.push({
          name: '@module-federation/modern-js-v3/data-fetch-server-plugin',
          options: {},
        });

        return { plugins };
      });
    }

    api.modifyBundlerChain(chain => {
      const target = chain.get('target');
      if (skipByTarget(target)) {
        return;
      }
      const isWeb = isWebTarget(target);

      if (!isWeb) {
        if (!chain.plugins.has(CHAIN_MF_PLUGIN_ID)) {
          if (secondarySharedTreeShaking) {
            chain
              .plugin(CHAIN_MF_PLUGIN_ID)
              .use(RspackTreeShakingSharedPlugin, [
                {
                  mfConfig: pluginOptions.ssrConfig,
                  secondary: true,
                } as any,
              ]);
          } else {
            chain
              .plugin(CHAIN_MF_PLUGIN_ID)
              .use(RspackModuleFederationPlugin, [pluginOptions.ssrConfig])
              .init((Plugin: typeof RspackModuleFederationPlugin, args) => {
                pluginOptions.nodePlugin = new Plugin(args[0]);
                return pluginOptions.nodePlugin;
              });
          }
        }
      }

      if (!isWeb && !secondarySharedTreeShaking) {
        chain.target('async-node');

        if (enableRsc) {
          chain.resolve.conditionNames.add('react-server');
        }

        if (isDev()) {
          chain
            .plugin('UniverseEntryChunkTrackerPlugin')
            .use(UniverseEntryChunkTrackerPlugin);
        }
      }

      if (isDev() && isWeb) {
        chain.externals({
          '@module-federation/node/utils': 'NOT_USED_IN_BROWSER',
        });
      }
    });
    // @ts-ignore
    api.config(() => {
      return {
        builderPlugins: [mfSSRRsbuildPlugin(pluginOptions)],
        dev: {
          setupMiddlewares: [
            middlewares =>
              middlewares.unshift((req, res, next) => {
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
              }),
          ],
        },
      };
    });
    const writeMergedManifest = () => {
      const { distOutputDir, assetResources } = pluginOptions;
      const browserAssets = assetResources.browser;
      const nodeAssets = assetResources.node;

      if (!distOutputDir || !browserAssets || !nodeAssets) {
        return;
      }
      try {
        updateStatsAndManifest(nodeAssets, browserAssets, distOutputDir);
      } catch (err) {
        logger.error(err);
      }
    };

    api.onAfterBuild(() => {
      writeMergedManifest();
    });
    api.onDevCompileDone(() => {
      // 热更后修改 manifest
      writeMergedManifest();
    });
  },
});

export default moduleFederationSSRPlugin;
