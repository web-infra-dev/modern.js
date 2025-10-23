import fs from 'fs';
import path from 'path';
import { bundle } from '@modern-js/node-bundle-require';
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

function patchContainerEntryModuleBuildError() {
  try {
    const path = require('path');
    const fs = require('fs');
    const { createRequire } = require('module');
    const localRequire = createRequire(__filename);
    const enhancedEntry = localRequire.resolve('@module-federation/enhanced');
    const enhancedDir = path.dirname(enhancedEntry);
    const candidatePaths = [
      path.join(enhancedDir, 'lib', 'container', 'ContainerEntryModule.js'),
      path.join(
        enhancedDir,
        '..',
        'lib',
        'container',
        'ContainerEntryModule.js',
      ),
    ];
    let containerModule;
    let containerModulePath: string | undefined;
    for (const candidate of candidatePaths) {
      if (fs.existsSync(candidate)) {
        containerModulePath = candidate;
        containerModule = require(candidate);
        break;
      }
    }
    if (!containerModule || !containerModulePath) {
      return;
    }
    const ContainerEntryModule =
      containerModule?.default ??
      containerModule?.ContainerEntryModule ??
      containerModule;
    if (!ContainerEntryModule || ContainerEntryModule.__modernJsPatched) {
      return;
    }

    const {
      normalizeWebpackPath,
    } = require('@module-federation/sdk/normalize-webpack-path');
    const webpack = require(normalizeWebpackPath('webpack')) as typeof import(
      'webpack',
    );
    const webpackSources = webpack.sources;
    const { Template, RuntimeGlobals } = webpack;
    const runtimeUtilsPath = containerModulePath.replace(
      /ContainerEntryModule\.js$/,
      'runtime/utils',
    );
    const { getFederationGlobalScope } = require(runtimeUtilsPath);
    const { PrefetchPlugin } = require('@module-federation/data-prefetch/cli');

    ContainerEntryModule.prototype.codeGeneration = function codeGeneration({
      moduleGraph,
      chunkGraph,
      runtimeTemplate,
    }: any) {
      const sources = new Map();
      const runtimeRequirements = new Set([
        RuntimeGlobals.definePropertyGetters,
        RuntimeGlobals.hasOwnProperty,
        RuntimeGlobals.exports,
      ]);
      const getters: string[] = [];

      for (const block of this.blocks) {
        const { dependencies } = block;
        const modules = dependencies.map((dependency: any) => {
          const dep = dependency;
          return {
            name: dep.exposedName,
            module: moduleGraph.getModule(dep),
            request: dep.userRequest,
          };
        });

        const missingModules = modules.filter((m: any) => !m.module);
        let str: string;

        if (missingModules.length > 0) {
          const requestList = missingModules
            .map((m: any) => m.request)
            .join(', ');
          logger.warn(
            `[module-federation] Skipping unavailable expose(s) during dev build: ${requestList}`,
          );
          str = `return Promise.reject(new Error(${JSON.stringify(
            `Missing exposed modules: ${requestList}`,
          )}));`;
        } else {
          str = `return ${runtimeTemplate.blockPromise({
            block,
            message: '',
            chunkGraph,
            runtimeRequirements,
          })}.then(${runtimeTemplate.returningFunction(
            runtimeTemplate.returningFunction(
              `(${modules
                .map(({ module, request }: any) =>
                  runtimeTemplate.moduleRaw({
                    module,
                    chunkGraph,
                    request,
                    weak: false,
                    runtimeRequirements,
                  }),
                )
                .join(', ')})`,
            ),
          )});`;
        }

        if (modules.length > 0) {
          getters.push(
            `${JSON.stringify(modules[0].name)}: ${runtimeTemplate.basicFunction('', str)}`,
          );
        }
      }

      const federationGlobal = getFederationGlobalScope(RuntimeGlobals || {});
      const source = Template.asString([
        `var moduleMap = {`,
        Template.indent(getters.join(',\n')),
        '};',
        `var get = ${runtimeTemplate.basicFunction('module, getScope', [
          `${RuntimeGlobals.currentRemoteGetScope} = getScope;`,
          'getScope = (',
          Template.indent([
            `${RuntimeGlobals.hasOwnProperty}(moduleMap, module)`,
            Template.indent([
              '? moduleMap[module]()',
              `: Promise.resolve().then(${runtimeTemplate.basicFunction(
                '',
                "throw new Error('Module \"' + module + '\" does not exist in container.');",
              )})`,
            ]),
          ]),
          ');',
          `${RuntimeGlobals.currentRemoteGetScope} = undefined;`,
          'return getScope;',
        ])};`,
        `var init = ${runtimeTemplate.basicFunction(
          'shareScope, initScope, remoteEntryInitOptions',
          [
            `return ${federationGlobal}.bundlerRuntime.initContainerEntry({${Template.indent(
              [
                `webpackRequire: ${RuntimeGlobals.require},`,
                `shareScope: shareScope,`,
                `initScope: initScope,`,
                `remoteEntryInitOptions: remoteEntryInitOptions,`,
                `shareScopeKey: ${JSON.stringify(this._shareScope)}`,
              ],
            )}`,
            '})',
          ],
        )};`,
        this._dataPrefetch ? PrefetchPlugin.setRemoteIdentifier() : '',
        this._dataPrefetch ? PrefetchPlugin.removeRemoteIdentifier() : '',
        '// This exports getters to disallow modifications',
        `${RuntimeGlobals.definePropertyGetters}(exports, {`,
        Template.indent([
          `get: ${runtimeTemplate.returningFunction('get')},`,
          `init: ${runtimeTemplate.returningFunction('init')}`,
        ]),
        '});',
      ]);

      sources.set(
        'javascript',
        this.useSourceMap || this.useSimpleSourceMap
          ? new webpackSources.OriginalSource(source, 'webpack/container-entry')
          : new webpackSources.RawSource(source),
      );

      return {
        sources,
        runtimeRequirements,
      };
    };

    ContainerEntryModule.__modernJsPatched = true;
    logger.info?.(
      '[module-federation] Applied ContainerEntryModule build error patch',
    );
  } catch (error) {
    console.error(
      '[module-federation] Failed to patch ContainerEntryModule build error handler',
      error,
    );
  }
}

patchContainerEntryModuleBuildError();

import type {
  AppTools,
  Bundler,
  CliPluginFuture,
  Rspack,
  UserConfig,
  webpack,
} from '@modern-js/app-tools';
import type { BundlerChainConfig } from '../interfaces/bundler';
import type { InternalModernPluginOptions } from '../types';

const RSC_UNSHARED_PACKAGES = [
  'server-only',
  'react',
  'react-dom',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
];

const MANIFEST_FILE_NAME = 'mf-manifest.json';
const REMOTE_ENTRY_NAME = 'remoteEntry.js';
const SSR_REMOTE_ENTRY_PATH = `bundles/static/${REMOTE_ENTRY_NAME}`;

const replaceManifestWithRemoteEntry = (url: string) => {
  const idx = url.lastIndexOf(MANIFEST_FILE_NAME);
  if (idx === -1) {
    return url;
  }
  return `${url.slice(0, idx)}${REMOTE_ENTRY_NAME}${url.slice(idx + MANIFEST_FILE_NAME.length)}`;
};

const replaceManifestWithSsrRemoteEntry = (url: string) => {
  const marker = `static/${MANIFEST_FILE_NAME}`;
  const idx = url.lastIndexOf(marker);
  if (idx === -1) {
    return replaceManifestWithRemoteEntry(url);
  }
  const prefix = url.slice(0, idx);
  const suffix = url.slice(idx + marker.length);
  return `${prefix}${SSR_REMOTE_ENTRY_PATH}${suffix}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const removeSharedEntry = (
  shared: MFPluginOptions.ModuleFederationPluginOptions['shared'] | undefined,
  packageName: string,
) => {
  if (!shared) {
    return;
  }

  if (Array.isArray(shared)) {
    shared.forEach(entry => {
      if (!isRecord(entry)) {
        return;
      }
      if (packageName in entry) {
        entry[packageName] = false;
      }
    });
    return;
  }

  if (isRecord(shared) && packageName in shared) {
    delete shared[packageName];
  }
};

const patchSharedConfigForRsc = (
  shared: MFPluginOptions.ModuleFederationPluginOptions['shared'] | undefined,
) => {
  RSC_UNSHARED_PACKAGES.forEach(packageName => {
    removeSharedEntry(shared, packageName);
  });
};

const defaultPath = path.resolve(process.cwd(), 'module-federation.config.ts');

export type ConfigType<T> = T extends 'webpack'
  ? webpack.Configuration
  : T extends 'rspack'
    ? Rspack.Configuration
    : never;

type RuntimePluginEntry = NonNullable<
  moduleFederationPlugin.ModuleFederationPluginOptions['runtimePlugins']
>[number];

export function setEnv(enableSSR: boolean) {
  if (enableSSR) {
    process.env.MF_DISABLE_EMIT_STATS = 'true';
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

  const preBundlePath = await bundle(mfConfigPath);
  const mfConfig = (await import(preBundlePath))
    .default as unknown as moduleFederationPlugin.ModuleFederationPluginOptions;

  return mfConfig;
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

const replaceManifestRemoteUrl = (
  remotes: Record<string, string> | undefined,
  remoteIpStrategy?: 'ipv4' | 'inherit',
) => {
  if (!remotes || remoteIpStrategy === 'inherit') {
    return;
  }
  const ipv4 = getIPV4();
  Object.keys(remotes).forEach(remoteKey => {
    const value = remotes[remoteKey];
    if (typeof value === 'string' && value.includes(LOCALHOST)) {
      remotes[remoteKey] = value.replace(LOCALHOST, ipv4);
    }
  });
};

const patchDTSConfig = (
  mfConfig: moduleFederationPlugin.ModuleFederationPluginOptions,
  isServer: boolean,
) => {
  if (isServer) {
    return;
  }
  const ModernJSRuntime = '@module-federation/modern-js/runtime';
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
  manifestRemotes?: Record<string, string>,
) => {
  if (mfConfig.remotes && manifestRemotes) {
    const updateRemoteString = (
      remoteKey: string | undefined,
      remoteValue: string,
    ) => {
      const [requestScope, ...locationParts] = remoteValue.split('@');
      if (!locationParts.length) {
        return remoteValue;
      }
      const location = locationParts.join('@');
      if (!location.includes(MANIFEST_FILE_NAME)) {
        return remoteValue;
      }
      const remoteName = remoteKey || requestScope;
      manifestRemotes[remoteName] = `${requestScope}@${location}`;
      const remoteEntryUrl = isServer
        ? replaceManifestWithSsrRemoteEntry(location)
        : replaceManifestWithRemoteEntry(location);
      return `${requestScope}@${remoteEntryUrl}`;
    };

    const updateRemotesContainer = (
      container:
        | moduleFederationPlugin.RemotesObject
        | moduleFederationPlugin.RemotesItem[],
    ) => {
      if (Array.isArray(container)) {
        container.forEach((item, index) => {
          if (typeof item === 'string') {
            container[index] = updateRemoteString(undefined, item);
            return;
          }
          if (!item || typeof item !== 'object') {
            return;
          }
          Object.keys(item).forEach(key => {
            const value = item[key];
            if (typeof value === 'string') {
              item[key] = updateRemoteString(key, value);
            } else if (Array.isArray(value)) {
              item[key] = value.map(entry =>
                typeof entry === 'string'
                  ? updateRemoteString(key, entry)
                  : entry,
              );
            } else if (
              value &&
              typeof value === 'object' &&
              typeof value.external === 'string'
            ) {
              value.external = updateRemoteString(key, value.external);
            }
          });
        });
        return;
      }

      Object.keys(container).forEach(remoteKey => {
        const remoteValue = container[remoteKey];
        if (typeof remoteValue === 'string') {
          container[remoteKey] = updateRemoteString(remoteKey, remoteValue);
        } else if (Array.isArray(remoteValue)) {
          container[remoteKey] = remoteValue.map(entry =>
            typeof entry === 'string'
              ? updateRemoteString(remoteKey, entry)
              : entry,
          );
        } else if (
          remoteValue &&
          typeof remoteValue === 'object' &&
          typeof remoteValue.external === 'string'
        ) {
          remoteValue.external = updateRemoteString(
            remoteKey,
            remoteValue.external,
          );
        }
      });
    };

    updateRemotesContainer(mfConfig.remotes);
  }

  replaceRemoteUrl(mfConfig, remoteIpStrategy);
  replaceManifestRemoteUrl(manifestRemotes, remoteIpStrategy);
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

  patchSharedConfigForRsc(mfConfig.shared);

  injectRuntimePlugins(
    require.resolve('@module-federation/modern-js/shared-strategy'),
    runtimePlugins,
  );

  if (enableSSR && isDev()) {
    injectRuntimePlugins(
      require.resolve('@module-federation/modern-js/resolve-entry-ipv4'),
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
      require.resolve('@module-federation/modern-js/inject-node-fetch'),
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

function patchIgnoreWarning<T extends Bundler>(chain: BundlerChainConfig) {
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
  ) as webpack.Configuration['watchOptions'];
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
  modernjsConfig: UserConfig<AppTools>;
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
    const port =
      modernjsConfig.dev?.port || modernjsConfig.server?.port || 8080;
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
): CliPluginFuture<AppTools> => ({
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
    userConfig.manifestRemotes = userConfig.manifestRemotes || {};
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
      const resolvedRemoteIpStrategy =
        (targetMFConfig.remoteIpStrategy as 'ipv4' | 'inherit' | undefined) ??
        userConfig.remoteIpStrategy ??
        'ipv4';

      patchMFConfig(
        targetMFConfig,
        !isWeb,
        resolvedRemoteIpStrategy,
        enableSSR,
        userConfig.manifestRemotes,
      );

      if (process.env.DEBUG_MF_CONFIG) {
        const logPrefix = `[MF CONFIG][${isWeb ? 'web' : 'server'}]`;
        const stringified = JSON.stringify(targetMFConfig.exposes, null, 2);
        console.log(`${logPrefix} exposes:`, stringified);
      }

      patchBundlerConfig({
        chain,
        isServer: !isWeb,
        modernjsConfig,
        mfConfig,
        enableSSR,
      });

      userConfig.distOutputDir =
        chain.output.get('path') || path.resolve(process.cwd(), 'dist');
    });
    api.config(() => {
      const bundlerType =
        api.getAppContext().bundlerType === 'rspack' ? 'rspack' : 'webpack';
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
              '@module-federation/modern-js/runtime',
            ),
          },
        },
        source: {
          define: defineConfig,
          enableAsyncEntry:
            bundlerType === 'rspack'
              ? (modernjsConfig.source?.enableAsyncEntry ?? true)
              : modernjsConfig.source?.enableAsyncEntry,
        },
        dev: {
          assetPrefix: modernjsConfig?.dev?.assetPrefix
            ? modernjsConfig.dev.assetPrefix
            : true,
        },
      };
    });
  },
});

export default moduleFederationConfigPlugin;

export { isWebTarget, skipByTarget };
