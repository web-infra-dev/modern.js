import 'react-server-dom-rspack/client.browser';

const ACTION_PREFIX = 'remote:';
const ACTION_REMAP_GLOBAL_KEY = '__MODERN_RSC_MF_ACTION_ID_MAP__';
const ACTION_REMAP_WAITERS_KEY = '__MODERN_RSC_MF_ACTION_ID_MAP_WAITERS__';
const MAX_CALLBACK_BOOTSTRAP_ATTEMPTS = 12;
const CALLBACK_BOOTSTRAP_RETRY_DELAY_MS = 0;

const patchedClientModules = new WeakSet();
const patchedCreateServerReferenceModules = new WeakSet();
const objectToString = Object.prototype.toString;
const runtimeRequireFromWrapper = (() => {
  try {
    // Access the module-wrapper require function when available.
    // biome-ignore lint/security/noGlobalEval: The bundler module wrapper exposes `require` via arguments only.
    return eval('arguments[2]');
  } catch (_) {
    return undefined;
  }
})();

function isObject(value) {
  return value !== null && objectToString.call(value) === '[object Object]';
}

function isFunction(value) {
  return objectToString.call(value) === '[object Function]';
}

function isString(value) {
  return objectToString.call(value) === '[object String]';
}

function getWebpackRequire() {
  if (
    isFunction(runtimeRequireFromWrapper) ||
    isObject(runtimeRequireFromWrapper)
  ) {
    return runtimeRequireFromWrapper;
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

function getActionRemapWaiters() {
  const map = globalThis[ACTION_REMAP_WAITERS_KEY];
  if (!(map instanceof Map)) {
    const waiters = new Map();
    globalThis[ACTION_REMAP_WAITERS_KEY] = waiters;
    return waiters;
  }
  return map;
}

function resolveActionId(id) {
  if (id.startsWith(ACTION_PREFIX)) {
    return Promise.resolve(id);
  }

  const remapMap = getActionRemapMap();
  const remappedId = remapMap[id];
  if (typeof remappedId === 'string') {
    return Promise.resolve(remappedId);
  }

  if (remappedId === false) {
    return Promise.resolve(id);
  }

  const webpackRequire = getWebpackRequire();
  const uniqueName =
    webpackRequire &&
    isObject(webpackRequire.initializeSharingData) &&
    isString(webpackRequire.initializeSharingData.uniqueName)
      ? webpackRequire.initializeSharingData.uniqueName
      : undefined;
  if (isString(uniqueName) && uniqueName.trim()) {
    const prefixedId = `${ACTION_PREFIX}${uniqueName}:${id}`;
    remapMap[id] = prefixedId;
    return Promise.resolve(prefixedId);
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

    if (containerAliases.length === 1) {
      const prefixedId = `${ACTION_PREFIX}${containerAliases[0]}:${id}`;
      remapMap[id] = prefixedId;
      return Promise.resolve(prefixedId);
    }
  }

  const remapWaiters = getActionRemapWaiters();
  return new Promise(resolve => {
    const waiters = remapWaiters.get(id) || [];
    waiters.push(resolve);
    remapWaiters.set(id, waiters);
    setTimeout(() => {
      const currentWaiters = remapWaiters.get(id);
      if (!currentWaiters) {
        return;
      }
      const waiterIndex = currentWaiters.indexOf(resolve);
      if (waiterIndex !== -1) {
        currentWaiters.splice(waiterIndex, 1);
      }
      if (currentWaiters.length === 0) {
        remapWaiters.delete(id);
      } else {
        remapWaiters.set(id, currentWaiters);
      }
      resolve(id);
    }, 0);
  });
}

function installCallbacksFromModuleCache() {
  const webpackRequire = getWebpackRequire();
  if (!webpackRequire || !isObject(webpackRequire.c)) {
    return false;
  }

  let installedAny = false;
  const moduleIds = Object.keys(webpackRequire.c);
  for (let index = 0; index < moduleIds.length; index += 1) {
    const moduleRecord = webpackRequire.c[moduleIds[index]];
    const moduleExports = moduleRecord?.exports;
    if (!isObject(moduleExports) || patchedClientModules.has(moduleExports)) {
      continue;
    }

    const clientRuntime = moduleExports;

    if (
      isFunction(clientRuntime.createServerReference) &&
      !patchedCreateServerReferenceModules.has(moduleExports)
    ) {
      const originalCreateServerReference = clientRuntime.createServerReference;
      clientRuntime.createServerReference =
        function patchedCreateServerReference(id, ...rest) {
          const actionReference = originalCreateServerReference.call(
            this,
            id,
            ...rest,
          );
          if (isFunction(actionReference) && isString(id)) {
            try {
              Object.defineProperty(actionReference, '$$id', {
                value: id,
                configurable: true,
              });
            } catch {
              actionReference.$$id = id;
            }
          }
          return actionReference;
        };
      patchedCreateServerReferenceModules.add(moduleExports);
    }

    if (
      !isFunction(clientRuntime.setServerCallback) ||
      !isFunction(clientRuntime.createServerReference) ||
      !isFunction(clientRuntime.createTemporaryReferenceSet) ||
      !isFunction(clientRuntime.createFromFetch) ||
      !isFunction(clientRuntime.encodeReply)
    ) {
      continue;
    }

    clientRuntime.setServerCallback(function callback(id, args) {
      const temporaryReferences = clientRuntime.createTemporaryReferenceSet();
      const bodyPromise = clientRuntime.encodeReply(
        Array.isArray(args) ? args : [],
        {
          temporaryReferences,
        },
      );
      return resolveActionId(id).then(actionId =>
        bodyPromise
          .then(body =>
            fetch(`${window.location.origin}${window.location.pathname}`, {
              method: 'POST',
              headers: {
                Accept: 'text/x-component',
                'x-rsc-action': actionId,
              },
              body,
            }),
          )
          .then(response => {
            if (!response.ok) {
              throw new Error(
                `[modern-js-v3:rsc-bridge] callback request failed (${response.status}) for "${actionId}"`,
              );
            }
            return clientRuntime.createFromFetch(Promise.resolve(response), {
              temporaryReferences,
            });
          }),
      );
    });

    patchedClientModules.add(moduleExports);
    installedAny = true;
  }

  return installedAny;
}

function bootstrapCallbacks(attempt = 0) {
  const installedAny = installCallbacksFromModuleCache();
  if (installedAny || attempt >= MAX_CALLBACK_BOOTSTRAP_ATTEMPTS) {
    return;
  }
  setTimeout(function retryBootstrap() {
    bootstrapCallbacks(attempt + 1);
  }, CALLBACK_BOOTSTRAP_RETRY_DELAY_MS);
}

if (globalThis?.window) {
  bootstrapCallbacks();
}
