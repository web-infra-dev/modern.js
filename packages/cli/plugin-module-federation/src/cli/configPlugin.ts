import fs from 'fs';
import path from 'path';
import { isWebTarget, skipByTarget } from './utils';
import { moduleFederationPlugin, encodeName } from '@module-federation/sdk';
import { PluginOptions } from '../types';
import { PLUGIN_IDENTIFIER } from '../constant';
import {
  autoDeleteSplitChunkCacheGroups,
  addDataFetchExposes,
} from '@module-federation/rsbuild-plugin/utils';
import { SERVER_BUNDLE_DIRECTORY, logger } from '@modern-js/utils';
import { isDev } from './utils';

import type { InternalModernPluginOptions } from '../types';
import type { Rspack, RspackChain } from '@rsbuild/core';
import type {
  FederationAppConfig as AppUserConfig,
  FederationCliPlugin,
} from '../types/cli';

// Clone containers without dropping function-valued MF options.
export function cloneConfig<T>(value: T): T {
  if (Array.isArray(value)) return value.map(cloneConfig) as T;
  if (
    value &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, cloneConfig(item)]),
    ) as T;
  }
  return value;
}

export type ConfigType = Rspack.Configuration;

type RuntimePluginEntry = NonNullable<
  moduleFederationPlugin.ModuleFederationPluginOptions['runtimePlugins']
>[number];

const resolvePackageFile = (
  packageName: string,
  esmRelativePath: string,
  cjsRelativePath: string,
): string => {
  const packageEntry = require.resolve(packageName);
  let packageRoot = path.dirname(packageEntry);
  while (!fs.existsSync(path.join(packageRoot, 'package.json'))) {
    const parentDir = path.dirname(packageRoot);
    if (parentDir === packageRoot) {
      throw new Error(
        `Unable to resolve package root for ${packageName} from ${packageEntry}`,
      );
    }
    packageRoot = parentDir;
  }

  return require.resolve(
    path.join(
      packageRoot,
      process.env.MODERN_LIB_FORMAT === 'esm'
        ? esmRelativePath
        : cjsRelativePath,
    ),
  );
};

const resolveNodeRuntimePlugin = (): string =>
  resolvePackageFile(
    '@module-federation/node',
    'dist/src/runtimePlugin.mjs',
    'dist/src/runtimePlugin.js',
  );

const resolveNodeRecordRemoteHashPlugin = (): string =>
  resolvePackageFile(
    '@module-federation/node',
    'dist/src/recordDynamicRemoteEntryHashPlugin.mjs',
    'dist/src/recordDynamicRemoteEntryHashPlugin.js',
  );

export function setEnv(enableSSR: boolean) {
  if (enableSSR) {
    process.env['MF_SSR_PRJ'] = 'true';
  }
}

export const getMFConfig = async (
  userConfig: PluginOptions,
): Promise<moduleFederationPlugin.ModuleFederationPluginOptions> => {
  const { config, configPath } = userConfig;
  if (config) {
    return config;
  }
  const mfConfigPath = path.resolve(
    configPath || 'module-federation.config.ts',
  );
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createJiti } = require('jiti');
  const jit = createJiti(mfConfigPath, {
    interopDefault: true,
    moduleCache: false,
  });
  const configModule = await jit.import(mfConfigPath);

  const resolvedConfig = (
    configModule &&
    typeof configModule === 'object' &&
    'default' in configModule
      ? (configModule as { default: unknown }).default
      : configModule
  ) as moduleFederationPlugin.ModuleFederationPluginOptions;

  return resolvedConfig;
};

const injectRuntimePlugins = (
  runtimePlugin: RuntimePluginEntry,
  runtimePlugins: RuntimePluginEntry[],
): void => {
  const pluginName =
    typeof runtimePlugin === 'string' ? runtimePlugin : runtimePlugin[0];

  const hasPlugin = runtimePlugins.some(existingPlugin => {
    if (typeof existingPlugin === 'string') {
      return existingPlugin === pluginName;
    }

    return existingPlugin[0] === pluginName;
  });

  if (!hasPlugin) {
    runtimePlugins.push(runtimePlugin);
  }
};

export const patchMFConfig = (
  mfConfig: moduleFederationPlugin.ModuleFederationPluginOptions,
  isServer: boolean,
) => {
  addDataFetchExposes(mfConfig.exposes, isServer);

  // Modern owns router integration. Direct Bridge imports must not activate
  // the engine's package-presence heuristic and its default React Router v6 alias.
  mfConfig.bridge ||= {};
  mfConfig.bridge.enableBridgeRouter ??= false;

  if (mfConfig.remoteType === undefined) {
    mfConfig.remoteType = 'script';
  }

  if (!mfConfig.name) {
    throw new Error(`${PLUGIN_IDENTIFIER} mfConfig.name can not be empty!`);
  }

  const runtimePlugins = [
    ...(mfConfig.runtimePlugins || []),
  ] as RuntimePluginEntry[];

  mfConfig.shareStrategy ??= 'loaded-first';

  if (isServer) {
    injectRuntimePlugins(resolveNodeRuntimePlugin(), runtimePlugins);
    if (isDev()) {
      injectRuntimePlugins(resolveNodeRecordRemoteHashPlugin(), runtimePlugins);
    }

    if (!mfConfig.library) {
      mfConfig.library = {
        type: 'commonjs-module',
        name: mfConfig.name,
      };
    } else {
      if (!mfConfig.library.type) {
        mfConfig.library.type = 'commonjs-module';
      }
      if (!mfConfig.library.name) {
        mfConfig.library.name = mfConfig.name;
      }
    }
  }

  mfConfig.runtimePlugins = runtimePlugins;

  if (!isServer) {
    if (mfConfig.library?.type === 'commonjs-module') {
      mfConfig.library.type = 'global';
    }
    return mfConfig;
  }

  mfConfig.dts = false;
  mfConfig.dev = false;

  return mfConfig;
};

export const setDefaultOptimizationTarget = (
  mfConfig: moduleFederationPlugin.ModuleFederationPluginOptions,
  enableSSR: boolean,
  isServer: boolean,
  autoOptimization = true,
) => {
  if (!autoOptimization) {
    return;
  }

  mfConfig.experiments ||= {};
  mfConfig.experiments.optimization ||= {};
  mfConfig.experiments.optimization.target ??=
    enableSSR && isServer ? 'node' : 'web';
};

function patchIgnoreWarning(chain: RspackChain) {
  const ignoreWarnings = chain.get('ignoreWarnings') || [];
  const ignoredMsgs = [
    'external script',
    'process.env.WS_NO_BUFFER_UTIL',
    `Can't resolve 'utf-8-validate`,
  ];
  ignoreWarnings.push(warning => {
    if (ignoredMsgs.some(msg => warning.message.includes(msg))) {
      return true;
    }
    return false;
  });
  chain.ignoreWarnings(ignoreWarnings);
}

export function addMyTypes2Ignored(
  chain: RspackChain,
  mfConfig: moduleFederationPlugin.ModuleFederationPluginOptions,
) {
  const watchOptions = chain.get(
    'watchOptions',
  ) as Rspack.Configuration['watchOptions'];
  if (!watchOptions || !watchOptions.ignored) {
    chain.watchOptions({
      ignored: /[\\/](?:\.git|node_modules|@mf-types)[\\/]/,
    });
    return;
  }
  const ignored = watchOptions.ignored;
  const DEFAULT_IGNORED_GLOB = '**/@mf-types/**';

  if (Array.isArray(ignored)) {
    if (
      mfConfig.dts !== false &&
      typeof mfConfig.dts === 'object' &&
      typeof mfConfig.dts.consumeTypes === 'object' &&
      mfConfig.dts.consumeTypes.remoteTypesFolder
    ) {
      chain.watchOptions({
        ...watchOptions,
        ignored: ignored.concat(
          `**/${mfConfig.dts.consumeTypes.remoteTypesFolder}/**`,
        ),
      });
    } else {
      chain.watchOptions({
        ...watchOptions,
        ignored: ignored.concat(DEFAULT_IGNORED_GLOB),
      });
    }

    return;
  }

  if (typeof ignored !== 'string') {
    chain.watchOptions({
      ...watchOptions,
      ignored: /[\\/](?:\.git|node_modules|@mf-types)[\\/]/,
    });
    return;
  }

  chain.watchOptions({
    ...watchOptions,
    ignored: [ignored, DEFAULT_IGNORED_GLOB],
  });
}
export function patchBundlerConfig(options: {
  chain: RspackChain;
  isServer: boolean;
  modernjsConfig: AppUserConfig;
  mfConfig: moduleFederationPlugin.ModuleFederationPluginOptions;
  enableSSR: boolean;
  port?: number;
}) {
  const { chain, modernjsConfig, isServer, mfConfig, enableSSR, port } =
    options;

  chain.optimization.delete('runtimeChunk');

  patchIgnoreWarning(chain);

  if (!chain.output.get('chunkLoadingGlobal')) {
    chain.output.chunkLoadingGlobal(`chunk_${mfConfig.name}`);
  }
  if (!chain.output.get('uniqueName')) {
    chain.output.uniqueName(mfConfig.name!);
  }

  const splitChunkConfig = chain.optimization.splitChunks.entries();
  if (!isServer) {
    autoDeleteSplitChunkCacheGroups(mfConfig, splitChunkConfig);
  }

  if (
    !isServer &&
    enableSSR &&
    splitChunkConfig &&
    typeof splitChunkConfig === 'object' &&
    splitChunkConfig.cacheGroups
  ) {
    const previousChunks = splitChunkConfig.chunks;
    splitChunkConfig.chunks = 'async';
    if (previousChunks && previousChunks !== 'async') {
      logger.warn(
        `splitChunks.chunks = "${previousChunks}" is not allowed with stream SSR mode; forcing "async"`,
      );
    }
  }

  if (
    isDev() &&
    port !== undefined &&
    chain.output.get('publicPath') === 'auto'
  ) {
    const publicPath = `http://localhost:${port}/`;
    chain.output.publicPath(publicPath);
  }

  if (isServer && enableSSR) {
    const uniqueName = mfConfig.name || chain.output.get('uniqueName');
    const chunkFileName = chain.output.get('chunkFilename');
    if (
      typeof chunkFileName === 'string' &&
      uniqueName &&
      !chunkFileName.includes(uniqueName)
    ) {
      const suffix = `${encodeName(uniqueName)}-[contenthash].js`;
      chain.output.chunkFilename(chunkFileName.replace('.js', suffix));
    }
  }

  if (
    modernjsConfig.deploy?.microFrontend &&
    Object.keys(mfConfig.exposes || {}).length
  ) {
    logger.info(
      'optimization.usedExports is set to "global" to avoid tree shaking issues in micro frontend mode.',
    );
    chain.optimization.usedExports('global');
  }
}

export const moduleFederationConfigPlugin = (
  userConfig: InternalModernPluginOptions,
): FederationCliPlugin => ({
  name: '@modern-js/builtin-module-federation-config',
  pre: ['@modern-js/plugin-initialize'],
  post: ['@modern-js/plugin-module-federation'],
  setup: async api => {
    const modernjsConfig = api.getConfig();
    const mfConfig = await getMFConfig(userConfig.originPluginOptions);
    const csrConfig = userConfig.csrConfig || cloneConfig(mfConfig);
    const ssrConfig = userConfig.ssrConfig || cloneConfig(mfConfig);
    userConfig.ssrConfig = ssrConfig;
    userConfig.csrConfig = csrConfig;
    const enableSSR = Boolean(
      userConfig.userConfig?.ssr ?? Boolean(modernjsConfig?.server?.ssr),
    );

    api.modifyBundlerChain(chain => {
      const target = chain.get('target');
      if (skipByTarget(target)) {
        return;
      }
      const isWeb = isWebTarget(target);
      addMyTypes2Ignored(chain, !isWeb ? ssrConfig : csrConfig);

      const targetMFConfig = !isWeb ? ssrConfig : csrConfig;
      setDefaultOptimizationTarget(
        targetMFConfig,
        enableSSR,
        !isWeb,
        userConfig.originPluginOptions.autoOptimization,
      );
      patchMFConfig(targetMFConfig, !isWeb);

      if (
        modernjsConfig.source?.enableAsyncEntry !== true &&
        targetMFConfig.experiments?.asyncStartup !== false
      ) {
        targetMFConfig.experiments ||= {};
        targetMFConfig.experiments.asyncStartup = true;
      }

      patchBundlerConfig({
        chain,
        isServer: !isWeb,
        modernjsConfig,
        mfConfig,
        enableSSR,
        port: api.getAppContext().port ?? modernjsConfig.server?.port,
      });

      if (isWeb) {
        userConfig.distOutputDir =
          chain.output.get('path') || api.getAppContext().distDirectory;
      } else if (enableSSR) {
        userConfig.userConfig ||= {};
        userConfig.userConfig.ssr ||= {};
        if (userConfig.userConfig.ssr === true) {
          userConfig.userConfig.ssr = {};
        }
        userConfig.userConfig.ssr.distOutputDir =
          chain.output.get('path') ||
          path.resolve(
            api.getAppContext().distDirectory,
            modernjsConfig.output?.distPath?.server || SERVER_BUNDLE_DIRECTORY,
          );
      }
    });
    api.config(() => {
      const devServerConfig = modernjsConfig.tools?.devServer;
      const corsWarnMsgs = [
        'View https://module-federation.io/guide/troubleshooting/other.html#cors-warn for more details.',
      ];
      if (
        typeof devServerConfig !== 'object' ||
        !('headers' in devServerConfig)
      ) {
        corsWarnMsgs.unshift(
          'Detect devServer.headers is empty, mf modern plugin will add default cors header: devServer.headers["Access-Control-Allow-Headers"] = "*". It is recommended to specify an allowlist of trusted origins instead.',
        );
      }

      const exposes = userConfig.csrConfig?.exposes;
      const hasExposes =
        exposes && Array.isArray(exposes)
          ? exposes.length > 0
          : Object.keys(exposes ?? {}).length > 0;
      const lazyCompilationDisabledByPlugin =
        hasExposes && modernjsConfig?.dev?.lazyCompilation !== false;

      if (corsWarnMsgs.length > 1 && hasExposes) {
        logger.warn(corsWarnMsgs.join('\n'));
      }
      if (lazyCompilationDisabledByPlugin) {
        logger.warn(
          'Detected exposes in the Module Federation config. The Modern.js v3 Module Federation plugin will set dev.lazyCompilation to false for producer apps.',
        );
      }

      const corsHeaders = hasExposes
        ? {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods':
              'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': '*',
          }
        : undefined;

      return {
        tools: {
          devServer: {
            headers: corsHeaders,
          },
        },
        source: {
          enableAsyncEntry: modernjsConfig.source?.enableAsyncEntry ?? true,
        },
        dev: {
          assetPrefix: modernjsConfig?.dev?.assetPrefix
            ? modernjsConfig.dev.assetPrefix
            : 'auto',
          lazyCompilation: hasExposes
            ? false
            : modernjsConfig?.dev?.lazyCompilation,
        },
      };
    });
  },
});

export default moduleFederationConfigPlugin;

export { isWebTarget, skipByTarget };
