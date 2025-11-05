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
    // biome-ignore format: SWC parser requires single-line type import
    const webpack = require(normalizeWebpackPath('webpack')) as typeof import('webpack');
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

/**
 * Detects if a file is client-only by checking filename or 'use client' directive
 */
function isClientOnly(filePath: string): boolean {
  // Check filename suffix (e.g., .client.tsx, .client.jsx, .client.ts, .client.js)
  if (/\.client\.[jt]sx?$/.test(filePath)) {
    return true;
  }

  // Check for 'use client' directive at start of file
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Remove comments and whitespace from the start
    const firstNonComment = content
      .replace(/^[\s\n]*\/\*[\s\S]*?\*\//, '') // Remove block comments
      .replace(/^[\s\n]*\/\/[^\n]*\n/, '') // Remove line comments
      .trim();
    return (
      firstNonComment.startsWith("'use client'") ||
      firstNonComment.startsWith('"use client"')
    );
  } catch {
    return false;
  }
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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
    require.resolve('@module-federation/modern-js-rsc/shared-strategy'),
    runtimePlugins,
  );

  if (enableSSR && isDev()) {
    injectRuntimePlugins(
      require.resolve('@module-federation/modern-js-rsc/resolve-entry-ipv4'),
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
      require.resolve('@module-federation/modern-js-rsc/inject-node-fetch'),
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

  // Persist remotes for server plugin (dev + prod) without relying on envs.
  try {
    const cwd = process.cwd();
    const storeDir = path.join(cwd, 'node_modules', '.modern-js');
    const storeFile = path.join(storeDir, 'mf-remotes.json');
    const definitions: Array<{ name: string; manifestUrl: string }> = [];
    if (manifestRemotes && Object.keys(manifestRemotes).length) {
      for (const [name, spec] of Object.entries(manifestRemotes)) {
        const at = spec.indexOf('@');
        const url = at >= 0 ? spec.slice(at + 1) : undefined;
        if (url) definitions.push({ name, manifestUrl: url });
      }
    }
    // Fallback: infer from mfConfig.remotes if needed
    if (definitions.length === 0 && mfConfig.remotes) {
      const push = (name: string, value: any) => {
        let str: string | undefined;
        if (typeof value === 'string') str = value;
        else if (Array.isArray(value))
          str = typeof value[0] === 'string' ? value[0] : undefined;
        else if (value && typeof value === 'object') {
          if (typeof (value as any).external === 'string')
            str = (value as any).external;
          else if (typeof (value as any).url === 'string')
            str = (value as any).url;
        }
        if (str?.includes('@')) {
          const parts = str.split('@');
          const url = parts.slice(1).join('@');
          if (url) definitions.push({ name, manifestUrl: url });
        }
      };
      if (Array.isArray(mfConfig.remotes)) {
        for (const item of mfConfig.remotes) {
          if (item && typeof item === 'object') {
            for (const [name, value] of Object.entries(item)) push(name, value);
          }
        }
      } else if (typeof mfConfig.remotes === 'object') {
        for (const [name, value] of Object.entries(mfConfig.remotes))
          push(name, value);
      }
    }
    if (definitions.length) {
      fs.mkdirSync(storeDir, { recursive: true });
      fs.writeFileSync(
        storeFile,
        JSON.stringify({ definitions }, null, 2),
        'utf-8',
      );
    }
  } catch {}

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
export function buildExposeResourceToKey(
  exposes: moduleFederationPlugin.ModuleFederationPluginOptions['exposes'],
  containerName: string,
): Map<string, { expose: string; container: string }> {
  const map = new Map<string, { expose: string; container: string }>();
  if (!exposes) {
    return map;
  }

  const exposesObj =
    typeof exposes === 'object' && !Array.isArray(exposes) ? exposes : {};

  for (const [exposeKey, exposeValue] of Object.entries(exposesObj)) {
    if (typeof exposeValue === 'string') {
      // Simple case: exposeValue is a path string
      const absolutePath = path.isAbsolute(exposeValue)
        ? exposeValue
        : path.resolve(process.cwd(), exposeValue);
      map.set(absolutePath, { expose: exposeKey, container: containerName });
    } else if (
      exposeValue &&
      typeof exposeValue === 'object' &&
      'import' in exposeValue &&
      typeof exposeValue.import === 'string'
    ) {
      // Object case: exposeValue has an import property
      const absolutePath = path.isAbsolute(exposeValue.import)
        ? exposeValue.import
        : path.resolve(process.cwd(), exposeValue.import);
      map.set(absolutePath, { expose: exposeKey, container: containerName });
    }
  }

  return map;
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
    const { appDirectory } = api.useAppContext();
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

      // Apply client-only expose filter for Node/SSR builds when enabled
      const appDir = appDirectory || process.cwd();

      if (!isWeb) {
        chain.resolve.alias.set(
          'react/shared-subset',
          path.resolve(__dirname, '../shims/react-shared-subset.js'),
        );
      }

      if (
        process.env.MF_FILTER_CLIENT_EXPOSES === '1' &&
        !isWeb &&
        targetMFConfig.exposes
      ) {
        const exposes = targetMFConfig.exposes;
        const exposesObj =
          typeof exposes === 'object' && !Array.isArray(exposes) ? exposes : {};

        // Import NormalModuleReplacementPlugin
        const {
          normalizeWebpackPath,
        } = require('@module-federation/sdk/normalize-webpack-path');
        const webpack = require(
          normalizeWebpackPath('webpack'),
        ) as typeof import('webpack');
        const { NormalModuleReplacementPlugin } = webpack;

        const stubPath = path.resolve(__dirname, './client-expose-stub.js');

        for (const [exposeKey, exposeValue] of Object.entries(exposesObj)) {
          // Handle different expose value formats
          let exposePath: string | undefined;
          if (typeof exposeValue === 'string') {
            exposePath = exposeValue;
          } else if (
            typeof exposeValue === 'object' &&
            exposeValue &&
            'import' in exposeValue &&
            typeof exposeValue.import === 'string'
          ) {
            exposePath = exposeValue.import;
          }

          if (!exposePath) {
            continue;
          }

          // Resolve to absolute path
          const absolutePath = path.resolve(appDir, exposePath);

          // Check if this is a client-only file
          if (isClientOnly(absolutePath)) {
            const escapedPath = escapeRegex(absolutePath);
            const pluginId = `mf-client-expose-stub-${exposeKey}`;

            if (process.env.DEBUG_MF_CONFIG) {
              console.log(
                `[MF CONFIG][${isWeb ? 'web' : 'server'}] Replacing client-only expose "${exposeKey}" (${absolutePath}) with stub`,
              );
            }

            chain
              .plugin(pluginId)
              .use(NormalModuleReplacementPlugin, [
                new RegExp(escapedPath),
                stubPath,
              ]);
          }
        }
      }

      // Ensure server builds include RSC server reference modules even when
      // the application's main entry is client-only (common for MF remotes).
      if (!isWeb) {
        const serverReferenceCandidates = [
          'src/server-entry.ts',
          'src/server-entry.js',
          'src/server-entry.mjs',
          'src/server-entry.cjs',
          'src/rsc-server-refs.ts',
          'src/rsc-server-refs.js',
          'src/rsc-server-refs.mjs',
          'src/rsc-server-refs.cjs',
        ]
          .map(relative => path.resolve(appDir, relative))
          .filter(candidate => fs.existsSync(candidate));

        if (serverReferenceCandidates.length > 0) {
          const refsPath = serverReferenceCandidates[0];
          let appended = false;
          const entryPoints = chain.entryPoints;

          if (entryPoints?.values) {
            for (const entry of entryPoints.values()) {
              if (entry?.add) {
                entry.add(refsPath);
                appended = true;
              }
            }
          }

          if (!appended) {
            chain.entry('main').add(refsPath);
          }

          if (process.env.DEBUG_RSC_PLUGIN) {
            console.log(
              '[MF RSC CONFIG] appended server reference entry to Node build:',
              refsPath,
            );
          }
        }
      }

      patchBundlerConfig({
        chain,
        isServer: !isWeb,
        modernjsConfig,
        mfConfig,
        enableSSR,
      });

      // Build and store the expose metadata for RSC federation
      if (targetMFConfig.exposes && targetMFConfig.name) {
        const exposeResourceToKey = buildExposeResourceToKey(
          targetMFConfig.exposes,
          targetMFConfig.name,
        );

        // Store in a compiler plugin so it's accessible in webpack hooks
        chain.plugin('mf-expose-metadata').use(
          class MFExposeMetadataPlugin {
            apply(compiler: any) {
              compiler.hooks.beforeCompile.tap(
                'MFExposeMetadataPlugin',
                (params: any) => {
                  if (!params.compilationDependencies) {
                    params.compilationDependencies = new Set();
                  }
                  // Store in a way accessible to other plugins
                  if (!compiler.__mfExposeMetadata) {
                    compiler.__mfExposeMetadata = exposeResourceToKey;
                  }
                },
              );
            }
          },
        );
      }

      userConfig.distOutputDir =
        chain.output.get('path') || path.resolve(process.cwd(), 'dist');
    });

    api.onAfterBuild(() => {
      const exposesCfg = userConfig.csrConfig?.exposes;
      if (!exposesCfg) {
        return;
      }

      const exposesObj =
        typeof exposesCfg === 'object' && !Array.isArray(exposesCfg)
          ? exposesCfg
          : {};

      if (Object.keys(exposesObj).length === 0) {
        return;
      }

      const distDir =
        userConfig.distOutputDir || path.resolve(process.cwd(), 'dist');
      const manifestCandidates = [
        path.join(distDir, 'static', MANIFEST_FILE_NAME),
        path.join(distDir, 'bundles', 'static', MANIFEST_FILE_NAME),
      ];

      if (manifestCandidates.some(candidate => fs.existsSync(candidate))) {
        return;
      }

      const pluginVersion = process.env.MF_PLUGIN_VERSION ?? '';
      const buildVersion = process.env.npm_package_version ?? '0.0.0';
      const buildName = path.basename(appDirectory || process.cwd());
      const manifestName =
        userConfig.csrConfig?.name || buildName || 'mf-remote';

      const filename =
        typeof userConfig.csrConfig?.filename === 'string'
          ? userConfig.csrConfig.filename
          : `static/${REMOTE_ENTRY_NAME}`;
      const normalizedFilename = filename
        .replace(/^\.\//, '')
        .replace(/^\//, '');
      const remoteEntryParts = normalizedFilename.split('/');
      const remoteEntryName = remoteEntryParts.pop() || REMOTE_ENTRY_NAME;
      const remoteEntryPath = remoteEntryParts.join('/');

      const normalizeBase = (value: string) =>
        value === '' ? '' : value.replace(/\/+$/, '');

      const assetPrefix =
        process.env.ASSET_PREFIX || modernjsConfig.output?.assetPrefix || '';
      const baseUrl = normalizeBase(assetPrefix);
      const joinWithBase = (base: string, relative: string) => {
        const cleanedBase = base.replace(/\/+$/, '');
        const cleanedRelative = relative.replace(/^\/+/, '');
        return `${cleanedBase}/${cleanedRelative}`;
      };
      const remoteEntryUrl = baseUrl
        ? joinWithBase(baseUrl, normalizedFilename)
        : `/${normalizedFilename.replace(/^\/+/, '')}`;
      const publicPath = baseUrl ? `${baseUrl}/` : '/';

      const exposes = Object.keys(exposesObj).map(exposeKey => {
        const cleaned = exposeKey.replace(/^\.\//, '');
        return {
          id: `${manifestName}:${cleaned}`,
          name: cleaned,
          path: exposeKey,
          assets: {
            js: { sync: [] as string[], async: [] as string[] },
            css: { sync: [] as string[], async: [] as string[] },
          },
        };
      });

      const zipName = '@mf-types.zip';
      const dtsName = '@mf-types.d.ts';
      const typesZipRelative = fs.existsSync(path.join(distDir, zipName))
        ? zipName
        : '';
      const typesDtsRelative = fs.existsSync(path.join(distDir, dtsName))
        ? dtsName
        : '';

      const manifest = {
        id: manifestName,
        name: manifestName,
        metaData: {
          name: manifestName,
          type: 'app',
          buildInfo: {
            buildVersion,
            buildName,
          },
          remoteEntry: {
            name: remoteEntryName,
            path: remoteEntryPath,
            type: 'global',
            url: remoteEntryUrl,
          },
          types: {
            path: '',
            name: '',
            zip: typesZipRelative,
            api: typesDtsRelative,
          },
          globalName:
            (userConfig.csrConfig?.library as undefined | { name?: string })
              ?.name || manifestName,
          pluginVersion,
          prefetchInterface: false,
          publicPath,
        },
        shared: [] as unknown[],
        remotes: [] as unknown[],
        exposes,
        remoteEntry: remoteEntryUrl,
      };

      for (const manifestPath of manifestCandidates) {
        try {
          fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
          fs.writeFileSync(
            manifestPath,
            JSON.stringify(manifest, null, 2),
            'utf-8',
          );
          if (process.env.DEBUG_MF_CONFIG) {
            console.log('[MF CONFIG] Wrote fallback manifest to', manifestPath);
          }
        } catch (error) {
          console.warn(
            `[MF CONFIG] Failed to write fallback manifest at ${manifestPath}:`,
            error,
          );
        }
      }
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
              '@module-federation/modern-js-rsc/runtime',
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
