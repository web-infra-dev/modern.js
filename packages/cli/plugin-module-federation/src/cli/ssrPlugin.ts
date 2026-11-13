import path from 'path';
import { SSRDependencyPlugin } from './SSRDependencyPlugin';
import fs from 'fs';
import {
  ModuleFederationPlugin as RspackModuleFederationPlugin,
  TreeShakingSharedPlugin as RspackTreeShakingSharedPlugin,
} from '@module-federation/enhanced/rspack';
import UniverseEntryChunkTrackerPlugin from '@module-federation/node/universe-entry-chunk-tracker-plugin';
import { logger } from '@modern-js/utils';
import { isDev } from './utils';
import {
  updateStatsAndManifest,
  SSRPublicPathPlugin,
  type StatsAssetResource,
} from '@module-federation/rsbuild-plugin/utils';
import {
  ManifestFileName,
  StatsFileName,
  simpleJoinRemoteEntry,
} from '@module-federation/sdk';
import type { moduleFederationPlugin } from '@module-federation/sdk';
import { isWebTarget, skipByTarget, resolveInternalPlugin } from './utils';

import type { RsbuildPlugin, ModifyRspackConfigFn } from '@rsbuild/core';
import type { FederationCliPlugin } from '../types/cli';
import type { AssetFileNames, InternalModernPluginOptions } from '../types';
import { BridgeSSRPlugin, getBridgeSSRRuntimePlugin } from './BridgeSSRPlugin';

export function setEnv() {
  process.env['MF_SSR_PRJ'] = 'true';
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

const STATIC_ASSET_MODULE_TYPES = ['asset', 'asset/resource'] as const;

const preserveStaticAssetPublicPath = (
  config: ModifyBundlerConfiguration,
  publicPath: unknown,
) => {
  if (
    typeof publicPath !== 'string' ||
    publicPath === '' ||
    publicPath === 'auto'
  ) {
    return;
  }
  config.module ||= {};
  const moduleConfig = config.module as {
    generator?: Record<string, Record<string, unknown> | undefined>;
  };
  moduleConfig.generator ||= {};

  for (const moduleType of STATIC_ASSET_MODULE_TYPES) {
    moduleConfig.generator[moduleType] ||= {};
    moduleConfig.generator[moduleType]!.publicPath ??= publicPath;
  }
};

const mfSSRRsbuildPlugin = (
  pluginOptions: Required<InternalModernPluginOptions>,
): RsbuildPlugin => {
  return {
    name: '@modern-js/plugin-mf-post-config',
    pre: ['@modern-js/builder-plugin-ssr'],
    setup(api) {
      let csrOutputPath = '';
      let ssrOutputPath = '';
      let ssrEnv = '';
      let csrEnv = '';

      if (isDev()) {
        pluginOptions.devManifestReady = false;
        api.onAfterCreateCompiler(({ compiler }) => {
          pluginOptions.devManifestPublication?.attach(compiler, () => {
            pluginOptions.devManifestReady = false;
          });
        });
        api.onBeforeDevCompile(() => {
          pluginOptions.devManifestReady = false;
        });
        // The server's default compile hook drains and prepares its generation.
        // Publish the merged manifest over HTTP only after that hook completes.
        api.onDevCompileDone({
          order: 'post',
          handler: ({ stats }) => {
            const compiled =
              !stats.hasErrors() &&
              (!pluginOptions.devManifestPublication ||
                pluginOptions.devManifestPublication.isReadyFor(stats));
            pluginOptions.devManifestReady =
              compiled &&
              (pluginOptions.devManifestPublication?.ssrReady ?? true);
            if (compiled && pluginOptions.devManifestPublication) {
              const manifest = JSON.parse(
                fs.readFileSync(
                  path.resolve(
                    pluginOptions.distOutputDir,
                    browserAssetFileNames.manifestFileName,
                  ),
                  'utf8',
                ),
              );
              pluginOptions.devManifestPublication.notifyReady(stats, {
                buildVersion: manifest.metaData.buildInfo.buildVersion,
                // Service mounts pair browser metadata with server HTML. HMR
                // keeps the old descriptor, so those consumers need a fresh
                // document after Node is ready, including later remounts.
                hot:
                  api.getNormalizedConfig().dev.hmr !== false &&
                  !manifest.exposes?.some(
                    (expose: { servicePath?: string }) =>
                      typeof expose.servicePath === 'string',
                  ),
              });
            }
          },
        });
      }

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
        const publicPath = config.output!.publicPath;
        preserveStaticAssetPublicPath(config, publicPath);
        config.output!.publicPath = `${publicPath}${path.relative(csrOutputPath, ssrOutputPath)}/`;
        return config;
      };
      api.modifyRspackConfig((config, utils) => {
        // Dynamic public paths own their runtime prefix. Identity and publication
        // still participate in the same dev lifecycle as static public paths.
        if (pluginOptions.csrConfig.getPublicPath) return config;
        modifySSRPublicPath(config, utils);
        if (ssrEnv === utils.environment.name) {
          config.plugins ||= [];
          config.plugins.push(new SSRPublicPathPlugin());
        }
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
): FederationCliPlugin => ({
  name: '@modern-js/builtin-module-federation-ssr',
  pre: [
    '@modern-js/plugin-module-federation-config',
    '@modern-js/plugin-module-federation',
  ],
  setup: async api => {
    const modernjsConfig = api.getConfig();
    const enableSSR =
      pluginOptions.userConfig?.ssr ?? Boolean(modernjsConfig?.server?.ssr);
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
      plugins.push(getBridgeSSRRuntimePlugin(__dirname));
      plugins.push({
        name: 'injectDataFetchFunction',
        path: resolveInternalPlugin(
          '../ssr-runtime/injectDataFetchFunctionPlugin',
        ),
        config: {
          fetchServerQuery,
        },
      });
      if (
        isDev() &&
        typeof pluginOptions.userConfig.ssr === 'object' &&
        pluginOptions.userConfig.ssr.cacheUpdates
      ) {
        plugins.push({
          name: 'mfSSRUpdate',
          path: resolveInternalPlugin('../ssr-runtime/updatePlugin'),
          config: { name: pluginOptions.ssrConfig.name },
        });
      }
      if (
        !isDev() ||
        (typeof pluginOptions.userConfig.ssr === 'object' &&
          pluginOptions.userConfig.ssr.cacheUpdates)
      ) {
        return { entrypoint, plugins };
      }
      plugins.push({
        name: 'mfSSRDev',
        path: resolveInternalPlugin('../ssr-runtime/devPlugin'),
        config: {},
      });
      return { entrypoint, plugins };
    });

    if (pluginOptions.ssrConfig.remotes) {
      api._internalServerPlugins(({ plugins }) => {
        plugins.push({
          name: resolveInternalPlugin('./server/data-fetch-server-plugin'),
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
        chain
          .plugin('modern-bridge-ssr')
          .use(BridgeSSRPlugin, [api.getAppContext().metaName]);
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
        if (isDev()) {
          chain
            .plugin('UniverseEntryChunkTrackerPlugin')
            .use(UniverseEntryChunkTrackerPlugin);
        }
      }

      if (
        !isWeb &&
        typeof pluginOptions.userConfig.ssr === 'object' &&
        pluginOptions.userConfig.ssr.cacheUpdates
      ) {
        chain.plugin('modern-ssr-dependencies').use(SSRDependencyPlugin, [
          {
            name: pluginOptions.ssrConfig.name!,
            remotes: Object.keys(pluginOptions.ssrConfig.remotes || {}),
          },
        ]);
      }

      if (isDev() && isWeb) {
        if (
          typeof pluginOptions.userConfig.ssr === 'object' &&
          pluginOptions.userConfig.ssr.cacheUpdates
        ) {
          chain.module
            .rule('mf-react-refresh-renderers')
            .test(/[/\\]react-refresh[/\\]runtime\.js$/)
            .use('mf-react-refresh-renderers')
            .loader(resolveInternalPlugin('./reactRefreshLoader'));
        }
        chain.externals({
          '@module-federation/node/utils': 'NOT_USED_IN_BROWSER',
        });
      }
    });
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
                    const outputRoot = pluginOptions.distOutputDir;
                    const pathname = decodeURIComponent(
                      new URL(req.url, 'http://localhost').pathname,
                    );
                    const filepath = path.resolve(outputRoot, `.${pathname}`);
                    if (
                      !filepath.startsWith(
                        `${path.resolve(outputRoot)}${path.sep}`,
                      )
                    )
                      return next();
                    const manifests = [
                      ...Object.values(
                        pluginOptions.assetFileNames.browser ||
                          getManifestAssetFileNames(
                            pluginOptions.csrConfig.manifest,
                          ),
                      ),
                      ...Object.values(
                        pluginOptions.assetFileNames.node ||
                          getManifestAssetFileNames(
                            pluginOptions.ssrConfig.manifest,
                          ),
                      ),
                    ];
                    if (
                      manifests.some(
                        name => path.resolve(outputRoot, name) === filepath,
                      ) &&
                      !pluginOptions.devManifestReady
                    ) {
                      res.statusCode = 503;
                      res.setHeader('Cache-Control', 'no-store');
                      res.end('Federation build is not ready');
                      return;
                    }
                    fs.statSync(filepath);
                    res.setHeader('Cache-Control', 'no-store');
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
    const writeMergedManifest = async (compilation?: object) => {
      const { distOutputDir, assetResources } = pluginOptions;
      const browserAssets = assetResources.browser;
      const nodeAssets = assetResources.node;

      try {
        if (isDev()) {
          await pluginOptions.waitForServiceRuntimePlugins?.(compilation);
          if (
            pluginOptions.devManifestPublication &&
            (!compilation ||
              !pluginOptions.devManifestPublication.publish(compilation))
          )
            return;
        }
        if (distOutputDir && browserAssets && nodeAssets) {
          updateStatsAndManifest(nodeAssets, browserAssets, distOutputDir);
        }
      } catch (err) {
        logger.error(err);
        throw err;
      }
    };

    api.onAfterBuild(async () => {
      await writeMergedManifest();
    });
    api.onDevCompileDone(async ({ stats }) => {
      if (stats.hasErrors()) return;
      await writeMergedManifest(stats);
    });
  },
});

export default moduleFederationSSRPlugin;
