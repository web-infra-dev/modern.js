import { setResolveActionId } from '@modern-js/runtime/rsc/client';
import {
  createFromFetch,
  createTemporaryReferenceSet,
  encodeReply,
  setServerCallback,
} from 'react-server-dom-rspack/client.browser';

const ACTION_PREFIX = 'remote:';
const ACTION_REMAP_GLOBAL_KEY = '__MODERN_RSC_MF_ACTION_ID_MAP__';
const ACTION_REMAP_WAITERS_KEY = '__MODERN_RSC_MF_ACTION_ID_MAP_WAITERS__';
const ACTION_REMAP_WAIT_TIMEOUT_MS = 3000;
const CALLBACK_INSTALL_RETRY_DELAY_MS = 50;
const MAX_CALLBACK_INSTALL_ATTEMPTS = 120;
const CALLBACK_CHUNK_LOADER_HOOK_FLAG = '__MODERN_RSC_MF_CALLBACK_HOOKED__';
let hasResolvedFallbackAlias = false;
let fallbackRemoteAlias;
let callbackInstallAttempts = 0;
const installedClientBrowserRuntimes = new WeakSet();

function isObject(value) {
  return typeof value === 'object' && value !== null;
}

function isFunction(value) {
  return typeof value === 'function';
}

const runtimeRequireFromWrapper = (() => {
  try {
    // Access the module-wrapper require function when available.
    // biome-ignore lint/security/noGlobalEval: The bundler module wrapper exposes `require` via arguments only.
    const wrapperRequire = eval('arguments[2]');
    if (isFunction(wrapperRequire) || isObject(wrapperRequire)) {
      return wrapperRequire;
    }
  } catch {}
  return undefined;
})();

function isClientBrowserRuntime(value) {
  return (
    isObject(value) &&
    isFunction(value.setServerCallback) &&
    isFunction(value.createTemporaryReferenceSet) &&
    isFunction(value.encodeReply) &&
    isFunction(value.createFromFetch)
  );
}

function getWebpackRequire() {
  if (runtimeRequireFromWrapper) {
    return runtimeRequireFromWrapper;
  }
  if (typeof __webpack_require__ !== 'undefined') {
    return __webpack_require__;
  }
  const runtime = globalThis.__webpack_require__;
  if (isFunction(runtime) || isObject(runtime)) {
    return runtime;
  }
  return undefined;
}

function getActionRemapMap() {
  const map = globalThis[ACTION_REMAP_GLOBAL_KEY];
  if (!isObject(map)) {
    globalThis[ACTION_REMAP_GLOBAL_KEY] = Object.create(null);
    return globalThis[ACTION_REMAP_GLOBAL_KEY];
  }
  return map;
}

function resolveFallbackRemoteAlias() {
  if (hasResolvedFallbackAlias) {
    return fallbackRemoteAlias;
  }

  const webpackRequire = getWebpackRequire();
  const runtimeInstance =
    webpackRequire &&
    isObject(webpackRequire.federation) &&
    isObject(webpackRequire.federation.instance)
      ? webpackRequire.federation.instance
      : undefined;
  if (!runtimeInstance) {
    return undefined;
  }

  const aliasSet = new Set();
  const remotes = Array.isArray(runtimeInstance.options?.remotes)
    ? runtimeInstance.options.remotes
    : [];
  for (const remote of remotes) {
    if (isObject(remote)) {
      const alias =
        typeof remote.alias === 'string' && remote.alias
          ? remote.alias
          : typeof remote.name === 'string' && remote.name
            ? remote.name
            : undefined;
      if (alias) {
        aliasSet.add(alias);
      }
    }
  }

  const idToRemoteMap = runtimeInstance.remoteHandler?.idToRemoteMap;
  if (isObject(idToRemoteMap)) {
    for (const remoteInfo of Object.values(idToRemoteMap)) {
      if (!isObject(remoteInfo)) {
        continue;
      }
      const name =
        typeof remoteInfo.name === 'string' && remoteInfo.name
          ? remoteInfo.name
          : undefined;
      if (name) {
        aliasSet.add(name);
      }
    }
  }

  if (aliasSet.size === 1) {
    fallbackRemoteAlias = Array.from(aliasSet)[0];
    hasResolvedFallbackAlias = true;
    return fallbackRemoteAlias;
  }

  if (aliasSet.size === 0 && !globalThis.window) {
    return undefined;
  }

  if (globalThis.window) {
    const containerAliases = Object.keys(globalThis.window).filter(alias => {
      const candidate = globalThis.window[alias];
      return (
        isObject(candidate) &&
        isFunction(candidate.get) &&
        isFunction(candidate.init)
      );
    });
    if (aliasSet.size === 0 && containerAliases.length === 1) {
      fallbackRemoteAlias = containerAliases[0];
      hasResolvedFallbackAlias = true;
      return fallbackRemoteAlias;
    }
    if (aliasSet.size === 0 && containerAliases.length === 0) {
      return undefined;
    }
  }

  fallbackRemoteAlias = undefined;
  hasResolvedFallbackAlias = true;
  return undefined;
}

function getActionRemapWaiters() {
  const waiters = globalThis[ACTION_REMAP_WAITERS_KEY];
  if (!(waiters instanceof Map)) {
    const nextWaiters = new Map();
    globalThis[ACTION_REMAP_WAITERS_KEY] = nextWaiters;
    return nextWaiters;
  }
  return waiters;
}

function resolveActionEndpoint() {
  if (!globalThis.window) {
    return '/';
  }

  const entryName = window.__MODERN_JS_ENTRY_NAME;
  if (!entryName || entryName === 'main' || entryName === 'index') {
    return '/';
  }
  return `/${entryName}`;
}

function waitForActionRemap(rawId) {
  const waiters = getActionRemapWaiters();
  return new Promise(resolve => {
    let settled = false;
    const resolveOnce = value => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutHandle);
      resolve(value);
    };

    const list = waiters.get(rawId) || [];
    list.push(resolveOnce);
    waiters.set(rawId, list);

    const timeoutHandle = setTimeout(() => {
      const current = waiters.get(rawId) || [];
      const next = current.filter(waiter => waiter !== resolveOnce);
      if (next.length === 0) {
        waiters.delete(rawId);
      } else {
        waiters.set(rawId, next);
      }
      resolveOnce(rawId);
    }, ACTION_REMAP_WAIT_TIMEOUT_MS);
  });
}

async function resolveActionId(id) {
  if (typeof id === 'string' && id.startsWith(ACTION_PREFIX)) {
    return id;
  }

  const remapMap = getActionRemapMap();
  const remappedId = remapMap[id];
  if (typeof remappedId === 'string') {
    return remappedId;
  }
  if (remappedId === false) {
    return id;
  }

  const fallbackAlias = resolveFallbackRemoteAlias();
  if (typeof fallbackAlias === 'string' && fallbackAlias) {
    const prefixedId = `${ACTION_PREFIX}${fallbackAlias}:${id}`;
    remapMap[id] = prefixedId;
    return prefixedId;
  }

  return waitForActionRemap(id);
}

function createServerCallback(runtime) {
  return async (id, args) => {
    const actionId = await resolveActionId(id);
    const temporaryReferences = runtime.createTemporaryReferenceSet();
    const body = await runtime.encodeReply(Array.isArray(args) ? args : [], {
      temporaryReferences,
    });
    const endpoint = resolveActionEndpoint();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'text/x-component',
        'x-rsc-action': actionId,
      },
      body,
    });

    if (!response.ok) {
      throw new Error(
        `[modern-js-v3:rsc-bridge] callback request failed (${response.status}) for "${actionId}"`,
      );
    }

    return runtime.createFromFetch(Promise.resolve(response), {
      temporaryReferences,
    });
  };
}

function collectClientBrowserRuntimes() {
  const runtimes = [];
  const maybePushRuntime = candidate => {
    if (isClientBrowserRuntime(candidate)) {
      runtimes.push(candidate);
    } else if (
      isObject(candidate) &&
      isClientBrowserRuntime(candidate.default)
    ) {
      runtimes.push(candidate.default);
    }
  };

  maybePushRuntime({
    createFromFetch,
    createTemporaryReferenceSet,
    encodeReply,
    setServerCallback,
  });

  const webpackRequire = getWebpackRequire();
  const moduleCache = webpackRequire?.c;
  if (isObject(moduleCache)) {
    for (const moduleRecord of Object.values(moduleCache)) {
      if (isObject(moduleRecord) && 'exports' in moduleRecord) {
        maybePushRuntime(moduleRecord.exports);
      }
    }
  }

  return runtimes;
}

function installServerCallbacks() {
  let installedCount = 0;
  for (const runtime of collectClientBrowserRuntimes()) {
    if (installedClientBrowserRuntimes.has(runtime)) {
      continue;
    }
    installedClientBrowserRuntimes.add(runtime);
    runtime.setServerCallback(createServerCallback(runtime));
    installedCount += 1;
  }
  return installedCount;
}

function hookChunkLoaderInstall() {
  const webpackRequire = getWebpackRequire();
  if (!webpackRequire || !isFunction(webpackRequire.e)) {
    return;
  }

  const chunkLoader = webpackRequire.e;
  if (chunkLoader[CALLBACK_CHUNK_LOADER_HOOK_FLAG]) {
    return;
  }

  const wrappedChunkLoader = function (...args) {
    const chunkLoadResult = chunkLoader.apply(this, args);
    Promise.resolve(chunkLoadResult)
      .catch(() => undefined)
      .then(() => {
        installServerCallbacks();
      });
    return chunkLoadResult;
  };
  wrappedChunkLoader[CALLBACK_CHUNK_LOADER_HOOK_FLAG] = true;
  webpackRequire.e = wrappedChunkLoader;
}

function runInstallAttempt() {
  hookChunkLoaderInstall();
  installServerCallbacks();
  callbackInstallAttempts += 1;

  if (
    callbackInstallAttempts >= MAX_CALLBACK_INSTALL_ATTEMPTS ||
    typeof setTimeout !== 'function'
  ) {
    return;
  }

  setTimeout(runInstallAttempt, CALLBACK_INSTALL_RETRY_DELAY_MS);
}

setResolveActionId(resolveActionId);

runInstallAttempt();
if (typeof queueMicrotask === 'function') {
  queueMicrotask(() => {
    installServerCallbacks();
  });
}
