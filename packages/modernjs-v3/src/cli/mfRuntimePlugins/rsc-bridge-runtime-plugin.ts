import type { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime';

const RSC_BRIDGE_EXPOSE = '__rspack_rsc_bridge__';
const ACTION_PREFIX = 'remote:';
const MODULE_PREFIX = 'remote-module:';
const ACTION_REMAP_GLOBAL_KEY = '__MODERN_RSC_MF_ACTION_ID_MAP__';
const ACTION_REMAP_WAITERS_KEY = '__MODERN_RSC_MF_ACTION_ID_MAP_WAITERS__';
const PROXY_MODULE_PREFIX = '__modernjs_mf_rsc_action_proxy__:';

type ManifestLike = {
  serverManifest?: Record<string, any>;
  clientManifest?: Record<string, any>;
  serverConsumerModuleMap?: Record<string, any>;
};

type BridgeModule = {
  getManifest?: () => ManifestLike;
  executeAction?: (actionId: string, args: unknown[]) => Promise<unknown>;
};

type ActionMapRecord = Record<string, { alias: string; rawActionId: string }>;
type ActionRemapWaiter = (prefixedActionId: string) => void;
type ActionRemapWaiterMap = Map<string, ActionRemapWaiter[]>;
type ActionRemapMap = Record<string, string | false>;
type WebpackRequireRuntime = {
  m?: Record<string, (module: { exports: any }) => void>;
  c?: Record<string, { exports?: unknown }>;
  rscM?: ManifestLike;
  federation?: {
    instance?: {
      loadRemote?: (request: string) => Promise<BridgeModule>;
    };
  };
};

declare const __webpack_require__: WebpackRequireRuntime;

const isObject = (value: unknown): value is Record<string, any> =>
  typeof value === 'object' && value !== null;

const stableStringify = (value: unknown) => {
  try {
    return JSON.stringify(value, (_key, current) => {
      if (Array.isArray(current)) {
        return current;
      }
      if (!isObject(current)) {
        return current;
      }
      return Object.fromEntries(
        Object.keys(current)
          .sort()
          .map(key => [key, current[key]]),
      );
    });
  } catch {
    return String(value);
  }
};

const assertNoConflict = (
  target: Record<string, any>,
  key: string,
  nextValue: unknown,
  alias: string,
  section: string,
) => {
  if (!Object.prototype.hasOwnProperty.call(target, key)) {
    return;
  }
  if (stableStringify(target[key]) !== stableStringify(nextValue)) {
    throw new Error(
      `[modern-js-v3:rsc-bridge] ${section} conflict for "${key}" while merging remote "${alias}"`,
    );
  }
};

const getNamespacedModuleId = (alias: string, rawId: string | number) =>
  `${MODULE_PREFIX}${alias}:${String(rawId)}`;

const getActionRemapMap = () => {
  const globalState = globalThis as typeof globalThis & {
    [ACTION_REMAP_GLOBAL_KEY]?: ActionRemapMap;
    [ACTION_REMAP_WAITERS_KEY]?: ActionRemapWaiterMap;
  };
  if (!isObject(globalState[ACTION_REMAP_GLOBAL_KEY])) {
    globalState[ACTION_REMAP_GLOBAL_KEY] = {};
  }
  return globalState[ACTION_REMAP_GLOBAL_KEY] as ActionRemapMap;
};

const getActionRemapWaiters = () => {
  const globalState = globalThis as typeof globalThis & {
    [ACTION_REMAP_WAITERS_KEY]?: ActionRemapWaiterMap;
  };
  const existingWaiters = globalState[ACTION_REMAP_WAITERS_KEY];
  if (!(existingWaiters instanceof Map)) {
    globalState[ACTION_REMAP_WAITERS_KEY] = new Map();
    return globalState[ACTION_REMAP_WAITERS_KEY] as ActionRemapWaiterMap;
  }
  return existingWaiters;
};

const registerActionRemap = (rawActionId: string, prefixedActionId: string) => {
  const remapMap = getActionRemapMap();
  const remapWaiters = getActionRemapWaiters();
  const existingValue = remapMap[rawActionId];
  if (typeof existingValue === 'undefined') {
    remapMap[rawActionId] = prefixedActionId;
    const waiters = remapWaiters.get(rawActionId);
    if (waiters?.length) {
      waiters.forEach(waiter => waiter(prefixedActionId));
      remapWaiters.delete(rawActionId);
    }
    return;
  }
  if (existingValue === prefixedActionId) {
    return;
  }
  // Ambiguous mapping across remotes; skip unsafe remap.
  remapMap[rawActionId] = false;
  const waiters = remapWaiters.get(rawActionId);
  if (waiters?.length) {
    waiters.forEach(waiter => waiter(rawActionId));
    remapWaiters.delete(rawActionId);
  }
};

const getWebpackRequireIfAvailable = (): WebpackRequireRuntime | undefined => {
  if (typeof __webpack_require__ !== 'undefined') {
    return __webpack_require__;
  }

  const runtime = (
    globalThis as typeof globalThis & {
      __webpack_require__?: WebpackRequireRuntime;
    }
  ).__webpack_require__;
  return isObject(runtime) ? (runtime as WebpackRequireRuntime) : undefined;
};

const getWebpackRequire = (): WebpackRequireRuntime => {
  const runtime = getWebpackRequireIfAvailable();
  if (!runtime) {
    throw new Error(
      '[modern-js-v3:rsc-bridge] __webpack_require__ is unavailable while installing the RSC bridge runtime plugin',
    );
  }
  return runtime;
};

const ensureHostManifest = () => {
  const webpackRequire = getWebpackRequire();
  if (!isObject(webpackRequire.rscM)) {
    webpackRequire.rscM = {};
  }
  const manifest = webpackRequire.rscM as ManifestLike;
  manifest.serverManifest = isObject(manifest.serverManifest)
    ? manifest.serverManifest
    : {};
  manifest.clientManifest = isObject(manifest.clientManifest)
    ? manifest.clientManifest
    : {};
  manifest.serverConsumerModuleMap = isObject(manifest.serverConsumerModuleMap)
    ? manifest.serverConsumerModuleMap
    : {};
  return manifest;
};

const remapConsumerNode = (
  alias: string,
  value: unknown,
  namespacedClientIds: Record<string, string>,
) => {
  if (!isObject(value)) {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value).map(([exportName, exportValue]) => {
      const nextExportValue = isObject(exportValue)
        ? { ...exportValue }
        : exportValue;
      if (isObject(nextExportValue) && nextExportValue.id != null) {
        const rawId = String(nextExportValue.id);
        nextExportValue.id = Object.prototype.hasOwnProperty.call(
          namespacedClientIds,
          rawId,
        )
          ? namespacedClientIds[rawId]
          : getNamespacedModuleId(alias, rawId);
      }
      return [exportName, nextExportValue];
    }),
  );
};

const getProxyModuleId = (alias: string) => `${PROXY_MODULE_PREFIX}${alias}`;

const installProxyModule = ({
  proxyModuleId,
  actionMap,
  ensureBridge,
}: {
  proxyModuleId: string;
  actionMap: ActionMapRecord;
  ensureBridge: (alias: string) => Promise<BridgeModule>;
}) => {
  const webpackRequire = getWebpackRequire();
  if (!isObject(webpackRequire.m)) {
    webpackRequire.m = {};
  }
  if (webpackRequire.m![proxyModuleId]) {
    return;
  }

  webpackRequire.m![proxyModuleId] = (module: { exports: any }) => {
    module.exports = new Proxy(
      {},
      {
        get(_target, property) {
          if (property === 'then') {
            return undefined;
          }
          if (typeof property !== 'string') {
            return undefined;
          }
          if (!Object.prototype.hasOwnProperty.call(actionMap, property)) {
            return undefined;
          }
          const mapping = actionMap[property];
          return async (...args: unknown[]) => {
            const bridge = await ensureBridge(mapping.alias);
            if (typeof bridge.executeAction !== 'function') {
              throw new Error(
                `[modern-js-v3:rsc-bridge] Missing executeAction bridge method for remote "${mapping.alias}"`,
              );
            }
            return bridge.executeAction(
              mapping.rawActionId,
              Array.isArray(args) ? args : [],
            );
          };
        },
      },
    );
  };
};

const isNodeLikeRuntime = () =>
  typeof process !== 'undefined' &&
  Boolean(process.versions?.node) &&
  typeof document === 'undefined';

const rscBridgeRuntimePlugin = (): ModuleFederationRuntimePlugin => {

  const bridgePromises: Partial<Record<string, Promise<BridgeModule>>> = {};
  const aliasMergePromises: Partial<Record<string, Promise<void>>> = {};
  const actionMap: ActionMapRecord = {};
  const mergedRemoteAliases = new Set<string>();

  const resolveRemoteAlias = (args: any): string | undefined => {
    const candidateAliases = [
      args?.remote?.alias,
      args?.pkgNameOrAlias,
      args?.remote?.name,
      args?.remoteInfo?.alias,
      args?.remoteInfo?.name,
      args?.name,
    ];
    for (const candidate of candidateAliases) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate;
      }
    }
    return undefined;
  };

  const ensureBridge = async (alias: string, args?: any) => {
    const existingBridgePromise = bridgePromises[alias];
    if (existingBridgePromise) {
      return existingBridgePromise;
    }
    const runtimeInstance =
      args?.origin && typeof args.origin.loadRemote === 'function'
        ? args.origin
        : getWebpackRequireIfAvailable()?.federation?.instance;
    if (!runtimeInstance || typeof runtimeInstance.loadRemote !== 'function') {
      throw new Error(
        '[modern-js-v3:rsc-bridge] Module Federation runtime instance is unavailable while loading the RSC bridge',
      );
    }
    const bridgePromise = Promise.resolve(
      runtimeInstance.loadRemote(`${alias}/${RSC_BRIDGE_EXPOSE}`),
    )
      .then((bridge: BridgeModule) => {
        if (
          !bridge ||
          typeof bridge.getManifest !== 'function' ||
          typeof bridge.executeAction !== 'function'
        ) {
          throw new Error(
            `[modern-js-v3:rsc-bridge] Remote "${alias}" is missing the internal RSC bridge expose`,
          );
        }
        return bridge;
      })
      .catch((error: unknown) => {
        // Allow retry when bridge loading fails transiently.
        delete bridgePromises[alias];
        throw error;
      });
    bridgePromises[alias] = bridgePromise;
    return bridgePromise;
  };

  const mergeRemoteManifest = (
    alias: string,
    remoteManifest: ManifestLike,
    proxyModuleId: string,
  ) => {
    if (!isObject(remoteManifest)) {
      return;
    }

    const hostManifest = ensureHostManifest();
    const namespacedClientIds: Record<string, string> = {};

    if (isObject(remoteManifest.clientManifest)) {
      for (const [key, value] of Object.entries(
        remoteManifest.clientManifest,
      )) {
        const nextValue = isObject(value) ? { ...value } : value;
        if (isObject(nextValue) && nextValue.id != null) {
          const namespacedClientId = getNamespacedModuleId(alias, nextValue.id);
          namespacedClientIds[String(nextValue.id)] = namespacedClientId;
          nextValue.id = namespacedClientId;
        }
        assertNoConflict(
          hostManifest.clientManifest as Record<string, any>,
          key,
          nextValue,
          alias,
          'clientManifest',
        );
        (hostManifest.clientManifest as Record<string, any>)[key] = nextValue;
      }
    }

    if (isObject(remoteManifest.serverConsumerModuleMap)) {
      for (const [rawModuleId, value] of Object.entries(
        remoteManifest.serverConsumerModuleMap,
      )) {
        const scopedModuleId = Object.prototype.hasOwnProperty.call(
          namespacedClientIds,
          String(rawModuleId),
        )
          ? namespacedClientIds[String(rawModuleId)]
          : getNamespacedModuleId(alias, rawModuleId);
        const nextValue = remapConsumerNode(alias, value, namespacedClientIds);
        assertNoConflict(
          hostManifest.serverConsumerModuleMap as Record<string, any>,
          scopedModuleId,
          nextValue,
          alias,
          'serverConsumerModuleMap',
        );
        (hostManifest.serverConsumerModuleMap as Record<string, any>)[
          scopedModuleId
        ] = nextValue;
      }
    }

    if (!isObject(remoteManifest.serverManifest)) {
      return;
    }

    for (const [rawActionId, actionEntry] of Object.entries(
      remoteManifest.serverManifest,
    )) {
      const prefixedActionId = `${ACTION_PREFIX}${alias}:${rawActionId}`;
      const hostActionEntry = {
        id: proxyModuleId,
        name: prefixedActionId,
        chunks: [],
        async:
          isObject(actionEntry) && 'async' in actionEntry
            ? (actionEntry as Record<string, any>).async
            : true,
      };
      assertNoConflict(
        hostManifest.serverManifest as Record<string, any>,
        prefixedActionId,
        hostActionEntry,
        alias,
        'serverManifest',
      );
      (hostManifest.serverManifest as Record<string, any>)[prefixedActionId] =
        hostActionEntry;
      actionMap[prefixedActionId] = { alias, rawActionId };
      registerActionRemap(rawActionId, prefixedActionId);
    }
  };

  const ensureRemoteAliasMerged = async (alias: string, args: any) => {
    const existingMergePromise = aliasMergePromises[alias];
    if (existingMergePromise) {
      await existingMergePromise;
      return;
    }
    if (mergedRemoteAliases.has(alias)) {
      return;
    }

    const mergePromise = (async () => {
      const proxyModuleId = getProxyModuleId(alias);
      installProxyModule({
        proxyModuleId,
        actionMap,
        ensureBridge: async resolvedAlias => ensureBridge(resolvedAlias, args),
      });

      try {
        const bridge = await ensureBridge(alias, args);
        const remoteManifest =
          typeof bridge.getManifest === 'function'
            ? await Promise.resolve(bridge.getManifest())
            : {};
        mergeRemoteManifest(alias, remoteManifest || {}, proxyModuleId);
        mergedRemoteAliases.add(alias);
      } catch (error) {
        throw error;
      }
    })();

    aliasMergePromises[alias] = mergePromise;
    try {
      await mergePromise;
    } finally {
      delete aliasMergePromises[alias];
    }
  };

  const ensureTrailingSlash = (value: string) =>
    value.endsWith('/') ? value : `${value}/`;

  const isAbsoluteHttpUrl = (value: string) =>
    value.startsWith('http://') || value.startsWith('https://');

  const isBrokenRemoteEntryUrl = (value: unknown) =>
    typeof value !== 'string' ||
    !value.trim() ||
    value.includes('undefined') ||
    value.startsWith('https:undefined') ||
    value.startsWith('http:undefined');

  const resolveSnapshotPublicPath = (snapshot: Record<string, any>) => {
    const metaData = isObject(snapshot.metaData)
      ? (snapshot.metaData as Record<string, any>)
      : undefined;
    const candidates = [
      snapshot.ssrPublicPath,
      snapshot.publicPath,
      metaData?.ssrPublicPath,
      metaData?.publicPath,
    ];
    const publicPath = candidates.find(
      candidate => typeof candidate === 'string' && candidate.trim(),
    ) as string | undefined;
    if (!publicPath) {
      return undefined;
    }
    return ensureTrailingSlash(publicPath.trim());
  };

  const resolveSnapshotRemoteEntryRequest = (snapshot: Record<string, any>) => {
    const remoteEntryCandidate = isObject(snapshot.ssrRemoteEntry)
      ? (snapshot.ssrRemoteEntry as Record<string, any>)
      : snapshot.ssrRemoteEntry ?? snapshot.remoteEntry;
    if (!remoteEntryCandidate) {
      return undefined;
    }

    let entryPath =
      typeof remoteEntryCandidate === 'string'
        ? remoteEntryCandidate
        : (() => {
            const pathPart =
              typeof remoteEntryCandidate.path === 'string'
                ? remoteEntryCandidate.path
                : '';
            const namePart =
              typeof remoteEntryCandidate.name === 'string'
                ? remoteEntryCandidate.name
                : '';
            return `${pathPart}${namePart}`;
          })();
    if (!entryPath) {
      return undefined;
    }

    if (isAbsoluteHttpUrl(entryPath)) {
      if (
        isNodeLikeRuntime() &&
        !snapshot.ssrRemoteEntry &&
        !entryPath.includes('/bundles/')
      ) {
        try {
          const url = new URL(entryPath);
          const normalizedPathname = url.pathname.startsWith('/')
            ? url.pathname.slice(1)
            : url.pathname;
          url.pathname = `/bundles/${normalizedPathname}`;
          return url.href;
        } catch {
          return entryPath;
        }
      }
      return entryPath;
    }

    if (isNodeLikeRuntime() && !snapshot.ssrRemoteEntry) {
      const normalizedEntryPath = entryPath.startsWith('/')
        ? entryPath.slice(1)
        : entryPath;
      if (!normalizedEntryPath.startsWith('bundles/')) {
        entryPath = `bundles/${normalizedEntryPath}`;
      }
    }

    const publicPath = resolveSnapshotPublicPath(snapshot);
    if (!publicPath) {
      return undefined;
    }

    try {
      return new URL(entryPath, publicPath).href;
    } catch {
      const normalizedEntry = entryPath.startsWith('/')
        ? entryPath.slice(1)
        : entryPath;
      return `${publicPath}${normalizedEntry}`;
    }
  };

  const patchRemoteInfoEntry = (
    remoteInfo: Record<string, any> | undefined,
    snapshot: Record<string, any> | undefined,
  ) => {
    if (!isObject(remoteInfo) || !isObject(snapshot)) {
      return;
    }
    const resolvedEntry = resolveSnapshotRemoteEntryRequest(snapshot);
    if (!resolvedEntry) {
      return;
    }

    if (
      isBrokenRemoteEntryUrl(remoteInfo.entry) ||
      (typeof remoteInfo.entry === 'string' &&
        remoteInfo.entry.includes('undefined'))
    ) {
      remoteInfo.entry = resolvedEntry;
    }
  };

  const normalizeRemoteEntryPath = (remoteEntry: Record<string, any>) => {
    if (
      remoteEntry.path === undefined ||
      remoteEntry.path === null ||
      remoteEntry.path === 'undefined'
    ) {
      remoteEntry.path = '';
    }
  };

  const patchSnapshotSsrPublicPath = (snapshot: any) => {
    if (!isObject(snapshot)) {
      return;
    }

    const metaData = isObject(snapshot.metaData)
      ? (snapshot.metaData as Record<string, any>)
      : undefined;

    const rawPublicPathCandidates = [
      snapshot.ssrPublicPath,
      snapshot.publicPath,
      metaData?.ssrPublicPath,
      metaData?.publicPath,
    ];
    const publicPath = rawPublicPathCandidates.find(
      candidate => typeof candidate === 'string' && candidate.trim(),
    ) as string | undefined;
    if (publicPath) {
      const normalizedPublicPath = ensureTrailingSlash(publicPath.trim());
      snapshot.ssrPublicPath = normalizedPublicPath;
      if (metaData) {
        metaData.ssrPublicPath = normalizedPublicPath;
      }
    }

    const remoteEntry = isObject(snapshot.remoteEntry)
      ? (snapshot.remoteEntry as Record<string, any>)
      : isObject(metaData?.remoteEntry)
        ? (metaData?.remoteEntry as Record<string, any>)
        : undefined;
    if (remoteEntry) {
      normalizeRemoteEntryPath(remoteEntry);
      if (!isObject(snapshot.remoteEntry)) {
        snapshot.remoteEntry = remoteEntry;
      }
      if (metaData && !isObject(metaData.remoteEntry)) {
        metaData.remoteEntry = remoteEntry;
      }
    }

    if (
      !isObject(snapshot.ssrRemoteEntry) &&
      (isObject(metaData?.ssrRemoteEntry) || remoteEntry)
    ) {
      const source = isObject(metaData?.ssrRemoteEntry)
        ? (metaData?.ssrRemoteEntry as Record<string, any>)
        : (remoteEntry as Record<string, any>);
      const normalizedSsrRemoteEntry = { ...source };
      normalizeRemoteEntryPath(normalizedSsrRemoteEntry);
      snapshot.ssrRemoteEntry = normalizedSsrRemoteEntry;
      if (metaData) {
        metaData.ssrRemoteEntry = { ...normalizedSsrRemoteEntry };
      }
    } else if (isObject(snapshot.ssrRemoteEntry)) {
      normalizeRemoteEntryPath(snapshot.ssrRemoteEntry as Record<string, any>);
      if (metaData && !isObject(metaData.ssrRemoteEntry)) {
        metaData.ssrRemoteEntry = snapshot.ssrRemoteEntry;
      }
    }
  };

  const patchRuntimeArgsSnapshots = (args: any) => {
    patchSnapshotSsrPublicPath(args?.remoteSnapshot);
    patchSnapshotSsrPublicPath(args?.remoteInfo);
    patchSnapshotSsrPublicPath(args?.remote?.remoteSnapshot);
    patchSnapshotSsrPublicPath(args?.remote?.remoteInfo);
    patchSnapshotSsrPublicPath(args?.resolvedRemote?.remoteSnapshot);
    patchSnapshotSsrPublicPath(args?.resolvedRemote?.remoteInfo);
    patchRemoteInfoEntry(args?.remoteInfo, args?.remoteSnapshot);
    patchRemoteInfoEntry(args?.remote?.remoteInfo, args?.remote?.remoteSnapshot);
    patchRemoteInfoEntry(
      args?.resolvedRemote?.remoteInfo,
      args?.resolvedRemote?.remoteSnapshot,
    );
  };

  return {
    name: 'modernjs-rsc-bridge-runtime-plugin',
    async afterResolve(args: any) {
      patchRuntimeArgsSnapshots(args);
      const alias = resolveRemoteAlias(args);
      if (!alias) {
        return args;
      }
      void ensureRemoteAliasMerged(alias, args);
      return args;
    },
    async onLoad(args: any) {
      patchRuntimeArgsSnapshots(args);
      const alias = resolveRemoteAlias(args);
      if (!alias) {
        return args;
      }

      const hasExposeContext =
        typeof args?.expose === 'string' ||
        typeof args?.id === 'string' ||
        typeof args?.id === 'number';
      if (!hasExposeContext) {
        await ensureRemoteAliasMerged(alias, args);
        return args;
      }

      const expose =
        typeof args?.expose === 'string' ? args.expose : String(args?.id || '');
      if (mergedRemoteAliases.has(alias) || expose.includes(RSC_BRIDGE_EXPOSE)) {
        return args;
      }
      await ensureRemoteAliasMerged(alias, args);

      return args;
    },
  };
};

export default rscBridgeRuntimePlugin;
