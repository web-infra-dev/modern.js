import type { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime';

const RSC_BRIDGE_EXPOSE = '__rspack_rsc_bridge__';
const ACTION_PREFIX = 'remote:';
const MODULE_PREFIX = 'remote-module:';
const ACTION_REMAP_GLOBAL_KEY = '__MODERN_RSC_MF_ACTION_ID_MAP__';
const ACTION_REMAP_WAITERS_KEY = '__MODERN_RSC_MF_ACTION_ID_MAP_WAITERS__';
const PROXY_MODULE_PREFIX = '__modernjs_mf_rsc_action_proxy__:';
const CALLBACK_INSTALL_RETRY_DELAY_MS = 0;
const MAX_CALLBACK_INSTALL_ATTEMPTS = 8;
const ACTION_REMAP_WAIT_TIMEOUT_MS = 32;

type ManifestLike = {
  serverManifest?: Record<string, any>;
  clientManifest?: Record<string, any>;
  serverConsumerModuleMap?: Record<string, any>;
};

type BridgeModule = {
  getManifest?: () => ManifestLike;
  getActionIds?: () => Promise<string[]> | string[];
  executeAction?: (actionId: string, args: unknown[]) => Promise<unknown>;
};

type ActionMapRecord = Record<string, { alias: string; rawActionId: string }>;
type ActionRemapWaiter = (prefixedActionId: string) => void;
type ActionRemapWaiterMap = Map<string, ActionRemapWaiter[]>;
type ActionRemapMap = Record<string, string | false>;
type ClientBrowserModuleExports = {
  setServerCallback?: (
    callback: (id: string, args: unknown[]) => unknown,
  ) => void;
  createFromFetch?: (
    responsePromise: Promise<Response>,
    options?: { temporaryReferences?: unknown },
  ) => unknown;
  encodeReply?: (
    args: unknown[],
    options?: { temporaryReferences?: unknown },
  ) => Promise<BodyInit>;
  createTemporaryReferenceSet?: () => unknown;
};
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

const resolveActionId = async (id: string) => {
  if (id.startsWith(ACTION_PREFIX)) {
    return id;
  }

  const remapMap = getActionRemapMap();
  const remappedId = remapMap[id];
  if (typeof remappedId === 'string') {
    return remappedId;
  }

  if (remapMap[id] === false) {
    return id;
  }

  const remapWaiters = getActionRemapWaiters();
  return new Promise<string>(resolve => {
    let settled = false;
    const waiter = (prefixedActionId: string) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutHandle);
      resolve(prefixedActionId);
    };
    const waiters = remapWaiters.get(id) || [];
    waiters.push(waiter);
    remapWaiters.set(id, waiters);

    const timeoutHandle = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      const currentWaiters = remapWaiters.get(id) || [];
      const nextWaiters = currentWaiters.filter(current => current !== waiter);
      if (nextWaiters.length === 0) {
        remapWaiters.delete(id);
      } else {
        remapWaiters.set(id, nextWaiters);
      }
      resolve(id);
    }, ACTION_REMAP_WAIT_TIMEOUT_MS);
  });
};

const resolveActionEndpoint = () => {
  if (typeof window === 'undefined') {
    return '/';
  }
  const entryName = window.__MODERN_JS_ENTRY_NAME;
  return entryName === 'main' || entryName === 'index' ? '/' : `/${entryName}`;
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

const getProxyModuleId = (instanceName?: string) =>
  `${PROXY_MODULE_PREFIX}${instanceName || 'container'}`;

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

const rscBridgeRuntimePlugin = (): ModuleFederationRuntimePlugin => {
  const bridgePromises: Partial<Record<string, Promise<BridgeModule>>> = {};
  const aliasMergePromises: Partial<Record<string, Promise<void>>> = {};
  const actionMap: ActionMapRecord = {};
  const mergedRemoteAliases = new Set<string>();
  const patchedClientBrowserModules = new WeakSet<object>();
  let callbackInstallAttempts = 0;
  let callbackInstallTimer: ReturnType<typeof setTimeout> | undefined;
  const waitForPendingAliasMerges = () => {
    const pendingAliases = Object.values(aliasMergePromises);
    if (pendingAliases.length === 0) {
      return Promise.resolve();
    }
    return Promise.all(pendingAliases).then(() => undefined);
  };

  const resolveRemoteAlias = (args: any): string | undefined => {
    const candidateAliases = [
      args?.remote?.alias,
      args?.pkgNameOrAlias,
      args?.remote?.name,
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

  const mergeRemoteActionIds = (
    alias: string,
    rawActionIds: string[],
    proxyModuleId: string,
  ) => {
    const hostManifest = ensureHostManifest();
    for (const rawActionId of rawActionIds) {
      const prefixedActionId = `${ACTION_PREFIX}${alias}:${rawActionId}`;
      const hostActionEntry = {
        id: proxyModuleId,
        name: prefixedActionId,
        chunks: [],
        async: true,
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

  const installCallbacksFromModuleCache = () => {
    const webpackRequire = getWebpackRequireIfAvailable();
    if (!webpackRequire || !isObject(webpackRequire.c)) {
      return false;
    }

    let installedAny = false;
    for (const moduleRecord of Object.values(webpackRequire.c)) {
      const moduleExports = moduleRecord?.exports;
      if (
        !isObject(moduleExports) ||
        patchedClientBrowserModules.has(moduleExports)
      ) {
        continue;
      }

      const clientBrowserExports = moduleExports as ClientBrowserModuleExports;
      if (
        typeof clientBrowserExports.setServerCallback !== 'function' ||
        typeof clientBrowserExports.createFromFetch !== 'function' ||
        typeof clientBrowserExports.encodeReply !== 'function'
      ) {
        continue;
      }

      clientBrowserExports.setServerCallback(
        async (id: string, args: unknown[]) => {
          if (Object.keys(aliasMergePromises).length > 0) {
            await waitForPendingAliasMerges();
          }
          const actionId = await resolveActionId(id);
          const endpoint = resolveActionEndpoint();
          const temporaryReferences =
            typeof clientBrowserExports.createTemporaryReferenceSet ===
            'function'
              ? clientBrowserExports.createTemporaryReferenceSet()
              : undefined;
          const encodedArgs = temporaryReferences
            ? await clientBrowserExports.encodeReply!(
                Array.isArray(args) ? args : [],
                {
                  temporaryReferences,
                },
              )
            : await clientBrowserExports.encodeReply!(
                Array.isArray(args) ? args : [],
              );
          const responsePromise = (async () => {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                Accept: 'text/x-component',
                'x-rsc-action': actionId,
              },
              body: encodedArgs,
            });
            if (!response.ok) {
              throw new Error(
                `[modern-js-v3:rsc-bridge] action request failed (${response.status}) for "${actionId}"`,
              );
            }
            return response;
          })();

          if (!temporaryReferences) {
            return clientBrowserExports.createFromFetch!(responsePromise);
          }

          return clientBrowserExports.createFromFetch!(responsePromise, {
            temporaryReferences,
          });
        },
      );
      patchedClientBrowserModules.add(moduleExports);
      installedAny = true;
    }

    return installedAny;
  };

  const runCallbackInstallAttempt = () => {
    callbackInstallTimer = undefined;
    const installedAny = installCallbacksFromModuleCache();
    if (installedAny) {
      callbackInstallAttempts = 0;
      return;
    }

    callbackInstallAttempts += 1;
    if (callbackInstallAttempts < MAX_CALLBACK_INSTALL_ATTEMPTS) {
      callbackInstallTimer = setTimeout(
        runCallbackInstallAttempt,
        CALLBACK_INSTALL_RETRY_DELAY_MS,
      );
    }
  };

  const installClientServerCallbacks = () => {
    if (typeof window === 'undefined') {
      return;
    }

    if (installCallbacksFromModuleCache()) {
      callbackInstallAttempts = 0;
      if (callbackInstallTimer) {
        clearTimeout(callbackInstallTimer);
        callbackInstallTimer = undefined;
      }
      return;
    }

    if (callbackInstallTimer) {
      return;
    }

    callbackInstallAttempts = 0;
    callbackInstallTimer = setTimeout(
      runCallbackInstallAttempt,
      CALLBACK_INSTALL_RETRY_DELAY_MS,
    );
  };

  const ensureRemoteAliasMerged = async (alias: string, args: any) => {
    if (mergedRemoteAliases.has(alias)) {
      return;
    }

    const existingMergePromise = aliasMergePromises[alias];
    if (existingMergePromise) {
      await existingMergePromise;
      return;
    }

    const mergePromise = (async () => {
      const proxyModuleId = getProxyModuleId(args?.options?.name);
      installProxyModule({
        proxyModuleId,
        actionMap,
        ensureBridge: async resolvedAlias => ensureBridge(resolvedAlias, args),
      });

      mergedRemoteAliases.add(alias);
      try {
        const bridge = await ensureBridge(alias, args);
        const remoteManifest =
          typeof bridge.getManifest === 'function'
            ? await Promise.resolve(bridge.getManifest())
            : {};
        mergeRemoteManifest(alias, remoteManifest || {}, proxyModuleId);
        if (
          (!isObject(remoteManifest) ||
            !isObject(remoteManifest.serverManifest) ||
            Object.keys(remoteManifest.serverManifest).length === 0) &&
          typeof bridge.getActionIds === 'function'
        ) {
          const bridgeActionIds = await Promise.resolve(bridge.getActionIds());
          if (Array.isArray(bridgeActionIds)) {
            const rawActionIds = bridgeActionIds.filter(
              actionId => typeof actionId === 'string',
            ) as string[];
            if (rawActionIds.length > 0) {
              mergeRemoteActionIds(alias, rawActionIds, proxyModuleId);
            }
          }
        }
      } catch (error) {
        mergedRemoteAliases.delete(alias);
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

  return {
    name: 'modernjs-rsc-bridge-runtime-plugin',
    beforeInit(args: any) {
      installClientServerCallbacks();
      const alias = resolveRemoteAlias(args);
      if (alias) {
        void ensureRemoteAliasMerged(alias, args);
      }
      return args;
    },
    async onLoad(args: any) {
      const alias = resolveRemoteAlias(args);
      if (!alias) {
        return args;
      }
      installClientServerCallbacks();

      const expose =
        typeof args?.expose === 'string' ? args.expose : String(args?.id || '');
      if (
        expose.includes(RSC_BRIDGE_EXPOSE) &&
        mergedRemoteAliases.has(alias)
      ) {
        return args;
      }
      await ensureRemoteAliasMerged(alias, args);

      return args;
    },
  };
};

export default rscBridgeRuntimePlugin;
