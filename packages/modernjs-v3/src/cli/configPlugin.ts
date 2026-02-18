import fs from 'fs';
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

const RSC_LAYER = 'react-server-components';
const RSC_BRIDGE_EXPOSE = './__rspack_rsc_bridge__';
const RSC_CLIENT_BROWSER_SHARED_KEY = 'react-server-dom-rspack/client.browser';

const resolveFirstExistingPath = (
  candidatePaths: string[],
  fallbackPath: string,
) =>
  candidatePaths.find(candidatePath => fs.existsSync(candidatePath)) ||
  fallbackPath;

const RSC_BRIDGE_RUNTIME_PLUGIN = resolveFirstExistingPath(
  [
    path.resolve(__dirname, './mfRuntimePlugins/rsc-bridge-runtime-plugin.ts'),
    path.resolve(__dirname, './mfRuntimePlugins/rsc-bridge-runtime-plugin.js'),
    path.resolve(
      __dirname,
      '../esm/cli/mfRuntimePlugins/rsc-bridge-runtime-plugin.mjs',
    ),
  ],
  require.resolve('@module-federation/modern-js-v3/rsc-bridge-runtime-plugin'),
);

const RSC_BRIDGE_EXPOSE_MODULE = resolveFirstExistingPath(
  [
    path.resolve(__dirname, '../runtime/rsc-bridge-expose.ts'),
    path.resolve(__dirname, '../runtime/rsc-bridge-expose.js'),
    path.resolve(__dirname, '../esm/runtime/rsc-bridge-expose.mjs'),
  ],
  require.resolve('@module-federation/modern-js-v3/rsc-bridge-expose'),
);

const RSC_CLIENT_CALLBACK_BOOTSTRAP_MODULE = resolveFirstExistingPath(
  [
    path.resolve(__dirname, '../runtime/rsc-client-callback-bootstrap.js'),
    path.resolve(__dirname, '../esm/runtime/rsc-client-callback-bootstrap.mjs'),
    path.resolve(
      path.dirname(RSC_BRIDGE_EXPOSE_MODULE),
      'rsc-client-callback-bootstrap.js',
    ),
    path.resolve(
      path.dirname(RSC_BRIDGE_EXPOSE_MODULE),
      'rsc-client-callback-bootstrap.mjs',
    ),
  ],
  path.resolve(__dirname, '../runtime/rsc-client-callback-bootstrap.js'),
);

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
      if (remote && typeof remote === 'object') {
        const external = (remote as { external?: unknown }).external;
        if (typeof external === 'string' && external.includes(LOCALHOST)) {
          (remote as { external?: string }).external = external.replace(
            LOCALHOST,
            ipv4,
          );
        }
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

const hasRemotes = (
  remotes: moduleFederationPlugin.ModuleFederationPluginOptions['remotes'],
) => {
  if (!remotes) {
    return false;
  }
  if (Array.isArray(remotes)) {
    return remotes.length > 0;
  }
  if (typeof remotes === 'string') {
    return remotes.length > 0;
  }
  return Object.keys(remotes).length > 0;
};

const hasExposes = (
  exposes: moduleFederationPlugin.ModuleFederationPluginOptions['exposes'],
) => {
  if (!exposes) {
    return false;
  }
  if (Array.isArray(exposes)) {
    return exposes.length > 0;
  }
  return Object.keys(exposes).length > 0;
};

const isRscMfEnabled = (
  mfConfig: moduleFederationPlugin.ModuleFederationPluginOptions,
) => Boolean((mfConfig.experiments as { rsc?: boolean } | undefined)?.rsc);

const normalizeExposeConfig = (
  exposeConfig: moduleFederationPlugin.ExposesObject[string],
) => {
  if (typeof exposeConfig === 'string' || Array.isArray(exposeConfig)) {
    return {
      import: exposeConfig,
    };
  }

  if (
    exposeConfig &&
    typeof exposeConfig === 'object' &&
    'import' in exposeConfig
  ) {
    return {
      ...(exposeConfig as Record<string, unknown>),
      import: (exposeConfig as { import: string | string[] }).import,
    };
  }

  return {
    import: exposeConfig as string,
  };
};

const setRscExposeConfig = (
  mfConfig: moduleFederationPlugin.ModuleFederationPluginOptions,
) => {
  if (!mfConfig.exposes) {
    return;
  }

  const normalizedExposes: moduleFederationPlugin.ExposesObject = {};

  const appendExpose = (
    exposeKey: string,
    exposeConfig: moduleFederationPlugin.ExposesObject[string],
  ) => {
    const normalizedConfig = normalizeExposeConfig(exposeConfig);
    const importList = Array.isArray(normalizedConfig.import)
      ? [...normalizedConfig.import]
      : [normalizedConfig.import];
    const normalizedImportList =
      exposeKey === RSC_BRIDGE_EXPOSE
        ? importList
        : [
            RSC_CLIENT_CALLBACK_BOOTSTRAP_MODULE,
            ...importList.filter(
              importPath => importPath !== RSC_CLIENT_CALLBACK_BOOTSTRAP_MODULE,
            ),
          ];
    const normalizedImport =
      normalizedImportList.length === 1
        ? normalizedImportList[0]
        : normalizedImportList;
    normalizedExposes[exposeKey] = {
      ...normalizedConfig,
      import: normalizedImport,
      layer: RSC_LAYER,
    } as moduleFederationPlugin.ExposesConfig;
  };

  if (Array.isArray(mfConfig.exposes)) {
    for (const exposeItem of mfConfig.exposes) {
      if (typeof exposeItem === 'string') {
        appendExpose(exposeItem, exposeItem);
        continue;
      }
      for (const [exposeKey, exposeConfig] of Object.entries(exposeItem)) {
        appendExpose(exposeKey, exposeConfig);
      }
    }
  } else {
    for (const [exposeKey, exposeConfig] of Object.entries(mfConfig.exposes)) {
      appendExpose(exposeKey, exposeConfig);
    }
  }

  if (
    !Object.prototype.hasOwnProperty.call(normalizedExposes, RSC_BRIDGE_EXPOSE)
  ) {
    normalizedExposes[RSC_BRIDGE_EXPOSE] = {
      import: RSC_BRIDGE_EXPOSE_MODULE,
      layer: RSC_LAYER,
    } as moduleFederationPlugin.ExposesConfig;
  }

  mfConfig.exposes = normalizedExposes;
};

const assertRscMfConfig = ({
  mfConfig,
  isServer,
  runtimePlugins,
}: {
  mfConfig: moduleFederationPlugin.ModuleFederationPluginOptions;
  isServer: boolean;
  runtimePlugins: RuntimePluginEntry[];
}) => {
  if (!isRscMfEnabled(mfConfig)) {
    return;
  }

  const asyncStartupEnabled =
    (mfConfig.experiments as { asyncStartup?: boolean } | undefined)
      ?.asyncStartup === true;
  if (!asyncStartupEnabled) {
    throw new Error(
      `${PLUGIN_IDENTIFIER} experiments.rsc requires experiments.asyncStartup = true`,
    );
  }

  if (!isServer) {
    return;
  }

  const nodeRuntimePluginPath = require.resolve(
    '@module-federation/node/runtimePlugin',
  );
  const hasNodeRuntimePlugin = runtimePlugins.some(runtimePlugin => {
    const runtimePluginPath =
      typeof runtimePlugin === 'string' ? runtimePlugin : runtimePlugin[0];
    return runtimePluginPath === nodeRuntimePluginPath;
  });

  if (!hasNodeRuntimePlugin) {
    throw new Error(
      `${PLUGIN_IDENTIFIER} experiments.rsc requires @module-federation/node/runtimePlugin in runtimePlugins`,
    );
  }
};

const patchRscClientBrowserSharedConfig = (
  mfConfig: moduleFederationPlugin.ModuleFederationPluginOptions,
  isServer: boolean,
) => {
  if (isServer || !mfConfig.shared) {
    return;
  }

  const patchSharedRecord = (sharedRecord: Record<string, unknown>) => {
    const clientBrowserShared = sharedRecord[RSC_CLIENT_BROWSER_SHARED_KEY] as
      | Record<string, unknown>
      | undefined;
    if (!clientBrowserShared || Array.isArray(clientBrowserShared)) {
      return;
    }
    const shareScope = clientBrowserShared.shareScope;
    if (typeof shareScope === 'string' && shareScope !== 'default') {
      clientBrowserShared.import = false;
    }
  };

  if (Array.isArray(mfConfig.shared)) {
    for (const sharedConfig of mfConfig.shared) {
      if (!sharedConfig || typeof sharedConfig !== 'object') {
        continue;
      }
      patchSharedRecord(sharedConfig as Record<string, unknown>);
    }
    return;
  }

  if (typeof mfConfig.shared === 'object') {
    patchSharedRecord(mfConfig.shared as Record<string, unknown>);
  }
};

export const patchMFConfig = (
  mfConfig: moduleFederationPlugin.ModuleFederationPluginOptions,
  isServer: boolean,
  remoteIpStrategy?: 'ipv4' | 'inherit',
  enableSSR?: boolean,
) => {
  const rscEnabled = isRscMfEnabled(mfConfig);

  replaceRemoteUrl(mfConfig, remoteIpStrategy);
  addDataFetchExposes(mfConfig.exposes, isServer);

  if (rscEnabled) {
    setRscExposeConfig(mfConfig);
    patchRscClientBrowserSharedConfig(mfConfig, isServer);
  }

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

  if (rscEnabled && hasRemotes(mfConfig.remotes)) {
    injectRuntimePlugins(RSC_BRIDGE_RUNTIME_PLUGIN, runtimePlugins);
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

  assertRscMfConfig({
    mfConfig,
    isServer,
    runtimePlugins,
  });

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

const patchProjectNodeModulesResolution = (chain: BundlerChainConfig) => {
  // Keep federation + RSC resolution rooted in the app workspace to avoid
  // divergent hoisted dependency paths between client/server manifests.
  const projectNodeModulesPath = path.resolve(process.cwd(), 'node_modules');
  if (!fs.existsSync(projectNodeModulesPath)) {
    return;
  }

  const resolveModules = chain.resolve.modules as {
    values?: () => string[];
    clear: () => unknown;
    add: (value: string) => unknown;
  };
  resolveModules.clear();
  resolveModules.add(projectNodeModulesPath);
  resolveModules.add('node_modules');
};

const patchServerOnlyAlias = (chain: BundlerChainConfig) => {
  // Align server-only package behavior for federated remote exposes across
  // both build targets.
  const serverOnlyEmptyPath = path.resolve(
    process.cwd(),
    'node_modules/server-only/empty.js',
  );
  if (!fs.existsSync(serverOnlyEmptyPath)) {
    return;
  }

  const aliasChain = chain.resolve.alias as {
    has?: (key: string) => boolean;
    set: (key: string, value: string) => unknown;
  };
  const hasServerOnlyAlias =
    typeof aliasChain.has === 'function' ? aliasChain.has('server-only$') : false;
  if (!hasServerOnlyAlias) {
    aliasChain.set('server-only$', serverOnlyEmptyPath);
  }
};

const resolveProjectDependency = (request: string) => {
  try {
    return require.resolve(request, { paths: [process.cwd()] });
  } catch {
    try {
      return require.resolve(request);
    } catch {
      return undefined;
    }
  }
};

const patchRscServerRuntimeAliases = (chain: BundlerChainConfig) => {
  const reactPackagePath = resolveProjectDependency('react/package.json');
  if (!reactPackagePath) {
    return;
  }

  const reactDir = path.dirname(reactPackagePath);
  const reactJsxRuntimeServerPath = path.join(
    reactDir,
    'jsx-runtime.react-server.js',
  );
  const reactJsxDevRuntimeServerPath = path.join(
    reactDir,
    'jsx-dev-runtime.react-server.js',
  );

  if (fs.existsSync(reactJsxRuntimeServerPath)) {
    chain.resolve.alias.set('react/jsx-runtime$', reactJsxRuntimeServerPath);
  }
  if (fs.existsSync(reactJsxDevRuntimeServerPath)) {
    chain.resolve.alias.set(
      'react/jsx-dev-runtime$',
      reactJsxDevRuntimeServerPath,
    );
  }
};

const getExposeImports = (
  exposeConfig: moduleFederationPlugin.ExposesObject[string],
): string[] => {
  if (typeof exposeConfig === 'string') {
    return [exposeConfig];
  }
  if (Array.isArray(exposeConfig)) {
    return exposeConfig.filter(
      (importPath): importPath is string => typeof importPath === 'string',
    );
  }
  if (
    exposeConfig &&
    typeof exposeConfig === 'object' &&
    'import' in exposeConfig
  ) {
    const exposeImport = (exposeConfig as { import?: unknown }).import;
    if (typeof exposeImport === 'string') {
      return [exposeImport];
    }
    if (Array.isArray(exposeImport)) {
      return exposeImport.filter(
        (importPath): importPath is string => typeof importPath === 'string',
      );
    }
  }
  return [];
};

const collectExposeImportDirectories = (
  exposes: moduleFederationPlugin.ModuleFederationPluginOptions['exposes'],
) => {
  if (!exposes) {
    return [];
  }

  const exposeEntries = Array.isArray(exposes)
    ? exposes.flatMap(exposeItem =>
        typeof exposeItem === 'string'
          ? [[exposeItem, exposeItem] as const]
          : (Object.entries(exposeItem || {}) as Array<
              readonly [
                string,
                moduleFederationPlugin.ExposesObject[string],
              ]
            >),
      )
    : (Object.entries(exposes) as Array<
        readonly [string, moduleFederationPlugin.ExposesObject[string]]
      >);

  const directories = new Set<string>();
  for (const [exposeKey, exposeConfig] of exposeEntries) {
    if (exposeKey === RSC_BRIDGE_EXPOSE) {
      continue;
    }
    for (const importPath of getExposeImports(exposeConfig)) {
      if (!importPath || !importPath.startsWith('.')) {
        continue;
      }
      directories.add(path.dirname(path.resolve(process.cwd(), importPath)));
    }
  }

  return Array.from(directories);
};

const patchRscRemoteComponentLayer = (
  chain: BundlerChainConfig,
  mfConfig: moduleFederationPlugin.ModuleFederationPluginOptions,
) => {
  // Derive layer coverage from actual expose imports instead of fixture-specific
  // source path conventions.
  const includeDirectories = collectExposeImportDirectories(mfConfig.exposes);
  if (includeDirectories.length === 0) {
    return;
  }

  const ruleChain = chain.module
    .rule('rsc-mf-remote-components-layer')
    .test(/\.[cm]?[jt]sx?$/);

  for (const includeDirectory of includeDirectories) {
    ruleChain.include.add(includeDirectory);
  }

  ruleChain.layer(RSC_LAYER);
};

const normalizePublicPath = (publicPath: string) =>
  publicPath.endsWith('/') ? publicPath.slice(0, -1) : publicPath;

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
  const rscMfEnabled = isRscMfEnabled(mfConfig);

  chain.optimization.delete('runtimeChunk');

  patchIgnoreWarning(chain);

  if (rscMfEnabled && isServer) {
    chain.resolve.conditionNames
      .clear()
      .add('require')
      .add('import')
      .add('default');
    if (hasExposes(mfConfig.exposes)) {
      chain.resolve.conditionNames.add('react-server');
    }
  }

  if (rscMfEnabled && hasExposes(mfConfig.exposes)) {
    patchProjectNodeModulesResolution(chain);
    patchServerOnlyAlias(chain);

    const assetPrefix = modernjsConfig.output?.assetPrefix;
    if (typeof assetPrefix === 'string' && assetPrefix.trim()) {
      const normalizedAssetPrefix = normalizePublicPath(assetPrefix.trim());
      chain.output.publicPath(
        isServer
          ? `${normalizedAssetPrefix}/bundles/`
          : `${normalizedAssetPrefix}/`,
      );
    }
    if (!isServer) {
      chain.optimization.splitChunks(false);
    } else {
      patchRscServerRuntimeAliases(chain);
      patchRscRemoteComponentLayer(chain, mfConfig);
    }
  }

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
        mfConfig: targetMFConfig,
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
