import path from 'path';
import { ModuleFederationPlugin as RspackModuleFederationPlugin } from '@module-federation/enhanced/rspack';
import { ModuleFederationPlugin } from '@module-federation/enhanced/webpack';
import UniverseEntryChunkTrackerPlugin from '@module-federation/node/universe-entry-chunk-tracker-plugin';
import { updateStatsAndManifest } from '@module-federation/rsbuild-plugin/utils';
import fs from 'fs-extra';
import logger from '../logger';
import { isDev } from './utils';
import { isWebTarget, skipByTarget } from './utils';

const MANIFEST_LOCATIONS = [
  ['static', 'mf-manifest.json'],
  ['bundles', 'static', 'mf-manifest.json'],
];

const REMOTE_ENTRY_BASENAME = 'static/remoteEntry.js';
const SSR_REMOTE_ENTRY_BASENAME = `bundles/${REMOTE_ENTRY_BASENAME}`;

const joinUrl = (base: string, relative: string) => {
  try {
    return new URL(relative, base).toString();
  } catch {
    return `${base.replace(/\/$/, '')}/${relative.replace(/^\//, '')}`;
  }
};

const normaliseRelativeEntry = (
  entry: { path?: string; name?: string } | undefined,
  fallback: string,
) => {
  if (!entry) {
    return fallback;
  }
  const name = typeof entry.name === 'string' ? entry.name : fallback;
  if (typeof entry.path !== 'string' || entry.path.length === 0) {
    return name;
  }
  return `${entry.path.replace(/\/$/, '')}/${name.replace(/^\//, '')}`;
};

const resolveEntryUrl = (
  candidate: unknown,
  base: string | undefined,
  fallback: string,
) => {
  if (!candidate) {
    return undefined;
  }

  if (typeof candidate === 'string') {
    if (/^https?:\/\//i.test(candidate) || !base) {
      return candidate;
    }
    return joinUrl(base, candidate);
  }

  if (typeof candidate === 'object') {
    const maybeUrl = (candidate as Record<string, unknown>).url;
    if (typeof maybeUrl === 'string') {
      return maybeUrl;
    }
    const relative = normaliseRelativeEntry(
      candidate as { path?: string; name?: string },
      fallback,
    );
    if (!base) {
      return relative;
    }
    return joinUrl(base, relative);
  }

  return undefined;
};

const computeClientRemoteEntryUrl = (manifest: Record<string, any>) => {
  const meta = manifest?.metaData ?? {};
  const base =
    typeof meta?.publicPath === 'string' ? meta.publicPath : undefined;
  const candidate = manifest?.remoteEntry ?? meta?.remoteEntry;
  const resolved = resolveEntryUrl(candidate, base, REMOTE_ENTRY_BASENAME);
  if (resolved) {
    return resolved;
  }
  if (base) {
    return joinUrl(base, REMOTE_ENTRY_BASENAME);
  }
  return undefined;
};

const computeSsrRemoteEntryUrl = (manifest: Record<string, any>) => {
  const meta = manifest?.metaData ?? {};
  const ssrBase =
    typeof meta?.ssrPublicPath === 'string'
      ? meta.ssrPublicPath
      : typeof meta?.publicPath === 'string'
        ? joinUrl(meta.publicPath, 'bundles/')
        : undefined;
  const candidate = manifest?.ssrRemoteEntry ?? meta?.ssrRemoteEntry;
  const resolved = resolveEntryUrl(
    candidate,
    ssrBase,
    SSR_REMOTE_ENTRY_BASENAME,
  );
  if (resolved) {
    return resolved;
  }
  if (ssrBase) {
    return joinUrl(ssrBase, REMOTE_ENTRY_BASENAME);
  }
  if (typeof meta?.publicPath === 'string') {
    return joinUrl(meta.publicPath, SSR_REMOTE_ENTRY_BASENAME);
  }
  return undefined;
};

const SSR_REMOTE_ENTRY_META_DEFAULT = {
  path: 'bundles/static',
  name: 'remoteEntry.js',
  type: 'commonjs-module',
} as const;

const patchManifestRemoteEntry = (distOutputDir: string) => {
  if (process.env.DEBUG_MF_RSC_SERVER) {
    console.log(`[MF RSC] Starting manifest patch in "${distOutputDir}"`);
  }
  for (const segments of MANIFEST_LOCATIONS) {
    const manifestPath = path.join(distOutputDir, ...segments);
    if (!fs.pathExistsSync(manifestPath)) {
      if (process.env.DEBUG_MF_RSC_SERVER) {
        console.log(
          `[MF RSC] Manifest not found at "${manifestPath}", skipping patch`,
        );
      }
      continue;
    }
    try {
      const manifest = JSON.parse(
        fs.readFileSync(manifestPath, 'utf-8'),
      ) as Record<string, any>;
      manifest.metaData = manifest.metaData ?? {};

      const remoteEntryUrl = computeClientRemoteEntryUrl(manifest);
      const ssrRemoteEntryUrl = computeSsrRemoteEntryUrl(manifest);

      if (remoteEntryUrl) {
        manifest.remoteEntry = remoteEntryUrl;
        const remoteMeta = manifest.metaData.remoteEntry;
        if (typeof remoteMeta === 'object' && remoteMeta) {
          remoteMeta.name =
            typeof remoteMeta.name === 'string'
              ? remoteMeta.name
              : REMOTE_ENTRY_BASENAME;
          remoteMeta.path =
            typeof remoteMeta.path === 'string' ? remoteMeta.path : '';
          remoteMeta.type =
            typeof remoteMeta.type === 'string' ? remoteMeta.type : 'global';
        } else {
          manifest.metaData.remoteEntry = {
            name: REMOTE_ENTRY_BASENAME,
            path: '',
            type: 'global',
          };
        }
      }

      if (ssrRemoteEntryUrl) {
        manifest.ssrRemoteEntry = ssrRemoteEntryUrl;
        manifest.metaData.ssrPublicPath =
          typeof manifest.metaData.ssrPublicPath === 'string'
            ? manifest.metaData.ssrPublicPath
            : (() => {
                const meta = manifest.metaData;
                if (typeof meta.publicPath === 'string') {
                  return joinUrl(meta.publicPath, 'bundles/');
                }
                return undefined;
              })();
        const ssrMeta = manifest.metaData.ssrRemoteEntry;
        if (typeof ssrMeta === 'object' && ssrMeta) {
          ssrMeta.name = SSR_REMOTE_ENTRY_META_DEFAULT.name;
          ssrMeta.path = SSR_REMOTE_ENTRY_META_DEFAULT.path;
          ssrMeta.type =
            typeof ssrMeta.type === 'string'
              ? ssrMeta.type
              : SSR_REMOTE_ENTRY_META_DEFAULT.type;
        } else {
          manifest.metaData.ssrRemoteEntry = {
            ...SSR_REMOTE_ENTRY_META_DEFAULT,
          };
        }
      }

      if (remoteEntryUrl || ssrRemoteEntryUrl) {
        fs.writeFileSync(
          manifestPath,
          JSON.stringify(manifest, null, 2),
          'utf-8',
        );
      }

      if (process.env.DEBUG_MF_RSC_SERVER) {
        if (remoteEntryUrl) {
          console.log(
            `[MF RSC] Injected remoteEntry "${remoteEntryUrl}" into ${manifestPath}`,
          );
        }
        if (ssrRemoteEntryUrl) {
          console.log(
            `[MF RSC] Injected ssrRemoteEntry "${ssrRemoteEntryUrl}" into ${manifestPath}`,
          );
        }
      }
    } catch (error) {
      logger.warn(
        `[MF RSC] Failed to patch remoteEntry for manifest ${manifestPath}:`,
        error,
      );
    }
  }
};

import type { AppTools, CliPluginFuture } from '@modern-js/app-tools';
import type {
  ModifyRspackConfigFn,
  ModifyWebpackConfigFn,
  RsbuildPlugin,
} from '@rsbuild/core';
import type { InternalModernPluginOptions, PluginOptions } from '../types';

export function setEnv() {
  process.env.MF_DISABLE_EMIT_STATS = 'true';
  process.env.MF_SSR_PRJ = 'true';
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
  setup: async api => {
    const modernjsConfig = api.getConfig();
    const explicitSSR =
      pluginOptions.userConfig?.ssr ?? modernjsConfig?.server?.ssr;
    const enableSSR =
      explicitSSR !== undefined
        ? Boolean(explicitSSR)
        : Boolean(modernjsConfig?.server?.rsc);

    if (process.env.DEBUG_MF_RSC_SERVER) {
      console.log(
        `[MF RSC] moduleFederationSSRPlugin enableSSR=${enableSSR} (server.ssr=${JSON.stringify(
          modernjsConfig?.server?.ssr,
        )})`,
      );
    }

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
    api._internalRuntimePlugins(({ entrypoint, plugins }) => {
      const remotes =
        pluginOptions.originPluginOptions?.remotes ||
        pluginOptions.ssrConfig?.remotes ||
        pluginOptions.csrConfig?.remotes;

      plugins.push({
        name: 'mfRscManifestMerger',
        path: '@module-federation/modern-js-rsc/rsc-manifest-merger',
        config: {
          remotes,
        },
      });
      return { entrypoint, plugins };
    });

    if (pluginOptions.ssrConfig.remotes) {
      api._internalServerPlugins(({ plugins }) => {
        plugins.push({
          name: '@module-federation/modern-js-rsc/data-fetch-server-plugin',
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
              if (process.env.DEBUG_MF_CONFIG) {
                console.log(
                  '[MF SSR CONFIG][server init] exposes:',
                  JSON.stringify(args[0]?.exposes, null, 2),
                );
              }
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

      if (process.env.DEBUG_MF_CONFIG) {
        const currentConfig = isWeb
          ? pluginOptions.csrConfig
          : pluginOptions.ssrConfig;
        console.log(
          '[MF SSR CONFIG][after modifyBundlerChain]',
          JSON.stringify(currentConfig?.exposes, null, 2),
        );
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
    const scheduleManifestPatch = (result: unknown, distOutputDir: string) => {
      const finalize = () => patchManifestRemoteEntry(distOutputDir);
      if (
        result &&
        typeof (result as PromiseLike<unknown>).then === 'function'
      ) {
        (result as PromiseLike<unknown>)
          .catch(error => {
            logger.warn(
              '[MF RSC] updateStatsAndManifest failed before manifest patch:',
              error,
            );
          })
          .finally(() => {
            finalize();
          });
        return;
      }
      finalize();
    };

    api.onAfterBuild(() => {
      const { nodePlugin, browserPlugin, distOutputDir } = pluginOptions;
      const result = updateStatsAndManifest(
        nodePlugin,
        browserPlugin,
        distOutputDir,
      );
      scheduleManifestPatch(result, distOutputDir);
    });
    api.onDevCompileDone(() => {
      // 热更后修改 manifest
      const { nodePlugin, browserPlugin, distOutputDir } = pluginOptions;
      const result = updateStatsAndManifest(
        nodePlugin,
        browserPlugin,
        distOutputDir,
      );
      scheduleManifestPatch(result, distOutputDir);
    });
  },
});

export default moduleFederationSSRPlugin;
