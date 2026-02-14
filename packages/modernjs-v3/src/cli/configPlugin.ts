import path from 'path';
import {
  addDataFetchExposes,
  autoDeleteSplitChunkCacheGroups,
} from '@module-federation/rsbuild-plugin/utils';
import {
  encodeName,
  type moduleFederationPlugin,
} from '@module-federation/sdk';
import { LOCALHOST, PLUGIN_IDENTIFIER } from '../constant';
import logger from '../logger';
import type { PluginOptions } from '../types';
import { getIPV4, isWebTarget, skipByTarget } from './utils';
import { isDev } from './utils';

import type {
  AppTools,
  AppUserConfig,
  CliPlugin,
  Rspack,
} from '@modern-js/app-tools';
import type { BundlerChainConfig } from '../interfaces/bundler';
import type { InternalModernPluginOptions } from '../types';

const defaultPath = path.resolve(process.cwd(), 'module-federation.config.ts');

export type ConfigType = Rspack.Configuration;

type RuntimePluginEntry = NonNullable<
  moduleFederationPlugin.ModuleFederationPluginOptions['runtimePlugins']
>[number];

export function setEnv(enableSSR: boolean) {
  if (enableSSR) {
    process.env.MF_SSR_PRJ = 'true';
  }
}

export const getMFConfig = async (
  userConfig: PluginOptions,
): Promise<moduleFederationPlugin.ModuleFederationPluginOptions> => {
  const { config, configPath } = userConfig;
  if (config) {
    return config;
  }
  const mfConfigPath = configPath ? configPath : defaultPath;
  const { createJiti } = require('jiti');
  const jit = createJiti(__filename, {
    interopDefault: true,
    esmResolve: true,
  });
  const configModule = await jit(mfConfigPath);

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

const replaceRemoteUrl = (
  mfConfig: moduleFederationPlugin.ModuleFederationPluginOptions,
  remoteIpStrategy?: 'ipv4' | 'inherit',
) => {
  if (remoteIpStrategy && remoteIpStrategy === 'inherit') {
    return;
  }
  if (!mfConfig.remotes) {
    return;
  }
  const ipv4 = getIPV4();
  const handleRemoteObject = (
    remoteObject: moduleFederationPlugin.RemotesObject,
  ) => {
    Object.keys(remoteObject).forEach(remoteKey => {
      const remote = remoteObject[remoteKey];
      // no support array items yet
      if (Array.isArray(remote)) {
        return;
      }
      if (typeof remote === 'string' && remote.includes(LOCALHOST)) {
        remoteObject[remoteKey] = remote.replace(LOCALHOST, ipv4);
      }
      if (
        typeof remote === 'object' &&
        !Array.isArray(remote.external) &&
        remote.external.includes(LOCALHOST)
      ) {
        remote.external = remote.external.replace(LOCALHOST, ipv4);
      }
    });
  };
  if (Array.isArray(mfConfig.remotes)) {
    mfConfig.remotes.forEach(remoteObject => {
      if (typeof remoteObject === 'string') {
        return;
      }
      handleRemoteObject(remoteObject);
    });
  } else if (typeof mfConfig.remotes !== 'string') {
    handleRemoteObject(mfConfig.remotes);
  }
};

const patchDTSConfig = (
  mfConfig: moduleFederationPlugin.ModuleFederationPluginOptions,
  isServer: boolean,
) => {
  if (isServer) {
    return;
  }
  const ModernJSRuntime = '@module-federation/modern-js-v3/runtime';
  if (mfConfig.dts !== false) {
    if (typeof mfConfig.dts === 'boolean' || mfConfig.dts === undefined) {
      mfConfig.dts = {
        consumeTypes: {
          runtimePkgs: [ModernJSRuntime],
        },
      };
    } else if (
      mfConfig.dts?.consumeTypes ||
      mfConfig.dts?.consumeTypes === undefined
    ) {
      if (
        typeof mfConfig.dts.consumeTypes === 'boolean' ||
        mfConfig.dts?.consumeTypes === undefined
      ) {
        mfConfig.dts.consumeTypes = {
          runtimePkgs: [ModernJSRuntime],
        };
      } else {
        mfConfig.dts.consumeTypes.runtimePkgs =
          mfConfig.dts.consumeTypes.runtimePkgs || [];
        if (!mfConfig.dts.consumeTypes.runtimePkgs.includes(ModernJSRuntime)) {
          mfConfig.dts.consumeTypes.runtimePkgs.push(ModernJSRuntime);
        }
      }
    }
  }
};

export const patchMFConfig = (
  mfConfig: moduleFederationPlugin.ModuleFederationPluginOptions,
  isServer: boolean,
  remoteIpStrategy?: 'ipv4' | 'inherit',
  enableSSR?: boolean,
) => {
  replaceRemoteUrl(mfConfig, remoteIpStrategy);
  addDataFetchExposes(mfConfig.exposes, isServer);

  if (mfConfig.remoteType === undefined) {
    mfConfig.remoteType = 'script';
  }

  if (!mfConfig.name) {
    throw new Error(`${PLUGIN_IDENTIFIER} mfConfig.name can not be empty!`);
  }

  const runtimePlugins = [
    ...(mfConfig.runtimePlugins || []),
  ] as RuntimePluginEntry[];

  patchDTSConfig(mfConfig, isServer);

  injectRuntimePlugins(
    require.resolve('@module-federation/modern-js-v3/shared-strategy'),
    runtimePlugins,
  );

  if (enableSSR && isDev()) {
    injectRuntimePlugins(
      require.resolve('@module-federation/modern-js-v3/resolve-entry-ipv4'),
      runtimePlugins,
    );
  }

  if (isServer) {
    injectRuntimePlugins(
      require.resolve('@module-federation/node/runtimePlugin'),
      runtimePlugins,
    );
    if (isDev()) {
      injectRuntimePlugins(
        require.resolve(
          '@module-federation/node/record-dynamic-remote-entry-hash-plugin',
        ),
        runtimePlugins,
      );
    }

    injectRuntimePlugins(
      require.resolve('@module-federation/modern-js-v3/inject-node-fetch'),
      runtimePlugins,
    );

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

function patchIgnoreWarning(chain: BundlerChainConfig) {
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
  chain: BundlerChainConfig,
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
    ignored: ignored.concat(DEFAULT_IGNORED_GLOB),
  });
}
export function patchBundlerConfig(options: {
  chain: BundlerChainConfig;
  isServer: boolean;
  modernjsConfig: AppUserConfig;
  mfConfig: moduleFederationPlugin.ModuleFederationPluginOptions;
  enableSSR: boolean;
}) {
  const { chain, modernjsConfig, isServer, mfConfig, enableSSR } = options;

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
    // @ts-ignore type not the same
    autoDeleteSplitChunkCacheGroups(mfConfig, splitChunkConfig);
  }

  if (
    !isServer &&
    enableSSR &&
    splitChunkConfig &&
    typeof splitChunkConfig === 'object' &&
    splitChunkConfig.cacheGroups
  ) {
    splitChunkConfig.chunks = 'async';
    logger.warn(
      `splitChunks.chunks = async is not allowed with stream SSR mode, it will auto changed to "async"`,
    );
  }

  if (isDev() && chain.output.get('publicPath') === 'auto') {
    // TODO: only in dev temp
    const port = modernjsConfig.server?.port || 8080;
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
  // modernjs project has the same entry for server/client, add polyfill:false to skip compile error in browser target
  if (isDev() && enableSSR && !isServer) {
    chain.resolve.fallback
      .set('crypto', false)
      .set('stream', false)
      .set('vm', false);
  }

  if (
    modernjsConfig.deploy?.microFrontend &&
    Object.keys(mfConfig.exposes || {}).length
  ) {
    chain.optimization.usedExports(false);
  }
}

export const moduleFederationConfigPlugin = (
  userConfig: InternalModernPluginOptions,
): CliPlugin<AppTools> => ({
  name: '@modern-js/plugin-module-federation-config',
  pre: ['@modern-js/plugin-initialize'],
  post: ['@modern-js/plugin-module-federation'],
  setup: async api => {
    const modernjsConfig = api.getConfig();
    const mfConfig = await getMFConfig(userConfig.originPluginOptions);
    const csrConfig =
      userConfig.csrConfig || JSON.parse(JSON.stringify(mfConfig));
    const ssrConfig =
      userConfig.ssrConfig || JSON.parse(JSON.stringify(mfConfig));
    userConfig.ssrConfig = ssrConfig;
    userConfig.csrConfig = csrConfig;
    const enableSSR = Boolean(
      userConfig.userConfig?.ssr ?? Boolean(modernjsConfig?.server?.ssr),
    );
    const enableRsc = Boolean(modernjsConfig?.server?.rsc);

    api.modifyBundlerChain(chain => {
      const target = chain.get('target');
      if (skipByTarget(target)) {
        return;
      }
      const isWeb = isWebTarget(target);
      addMyTypes2Ignored(chain, !isWeb ? ssrConfig : csrConfig);

      const targetMFConfig = !isWeb ? ssrConfig : csrConfig;
      patchMFConfig(
        targetMFConfig,
        !isWeb,
        userConfig.remoteIpStrategy || 'ipv4',
        enableSSR,
      );

      patchBundlerConfig({
        chain,
        isServer: !isWeb,
        modernjsConfig,
        mfConfig,
        enableSSR,
      });

      if (isWeb) {
        userConfig.distOutputDir =
          chain.output.get('path') || path.resolve(process.cwd(), 'dist');
      } else if (enableSSR && !enableRsc) {
        userConfig.userConfig ||= {};
        userConfig.userConfig.ssr ||= {};
        if (userConfig.userConfig.ssr === true) {
          userConfig.userConfig.ssr = {};
        }
        userConfig.userConfig.ssr.distOutputDir =
          chain.output.get('path') ||
          path.resolve(process.cwd(), 'dist/bundles');
      }
    });
    api.config(() => {
      const ipv4 = getIPV4();

      if (userConfig.remoteIpStrategy === undefined) {
        if (!enableSSR) {
          userConfig.remoteIpStrategy = 'inherit';
        } else {
          userConfig.remoteIpStrategy = 'ipv4';
        }
      }

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
          ? exposes.length
          : Object.keys(exposes ?? {}).length;

      if (corsWarnMsgs.length > 1 && hasExposes) {
        logger.warn(corsWarnMsgs.join('\n'));
      }

      const corsHeaders = hasExposes
        ? {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods':
              'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': '*',
          }
        : undefined;
      const defineConfig = {
        REMOTE_IP_STRATEGY: JSON.stringify(userConfig.remoteIpStrategy),
      };
      if (enableSSR && isDev()) {
        defineConfig.FEDERATION_IPV4 = JSON.stringify(ipv4);
      }
      return {
        tools: {
          devServer: {
            headers: corsHeaders,
          },
        },
        resolve: {
          alias: {
            // TODO: deprecated
            '@modern-js/runtime/mf': require.resolve(
              '@module-federation/modern-js-v3/runtime',
            ),
          },
        },
        source: {
          define: defineConfig,
          enableAsyncEntry:
            modernjsConfig.source?.enableAsyncEntry ?? !enableRsc,
        },
        dev: {
          assetPrefix: modernjsConfig?.dev?.assetPrefix
            ? modernjsConfig.dev.assetPrefix
            : 'auto',
        },
      };
    });
  },
});

export default moduleFederationConfigPlugin;

export { isWebTarget, skipByTarget };
