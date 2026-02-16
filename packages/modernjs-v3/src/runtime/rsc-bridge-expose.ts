type ManifestLike = {
  serverManifest?: Record<string, unknown>;
  clientManifest?: Record<string, unknown>;
  serverConsumerModuleMap?: Record<string, unknown>;
};

type ExposeModuleMap = Record<
  string,
  () => Promise<(() => unknown) | unknown> | (() => unknown) | unknown
>;

type WebpackRequireRuntime = {
  initializeExposesData?: {
    moduleMap?: ExposeModuleMap;
  };
  m?: Record<string, unknown>;
  c?: Record<string, { exports?: unknown }>;
  rscM?: ManifestLike;
};

declare const __webpack_require__: WebpackRequireRuntime;

const BRIDGE_EXPOSE_NAME = './__rspack_rsc_bridge__';
const actionReferenceCache: Record<string, (...args: unknown[]) => unknown> =
  Object.create(null);
const actionIdFallbackCache: Record<string, true> = Object.create(null);
let scanPromise: Promise<void> | null = null;
let scanHadErrors = false;
const ACTION_ID_PATTERN = /\b[a-f0-9]{64}\b/g;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
const isFunction = (value: unknown): value is (...args: unknown[]) => unknown =>
  typeof value === 'function';
const isWebpackRequireRuntime = (
  value: unknown,
): value is WebpackRequireRuntime => isObject(value) || isFunction(value);
const runtimeRequireFromWrapper: WebpackRequireRuntime | undefined = (() => {
  try {
    // Access the module-wrapper require function when available.
    // biome-ignore lint/security/noGlobalEval: The bundler module wrapper exposes `require` via arguments only.
    const wrapperRequire = eval('arguments[2]');
    return isWebpackRequireRuntime(wrapperRequire)
      ? (wrapperRequire as WebpackRequireRuntime)
      : undefined;
  } catch {
    return undefined;
  }
})();

const getWebpackRequire = (): WebpackRequireRuntime => {
  if (runtimeRequireFromWrapper) {
    return runtimeRequireFromWrapper;
  }

  if (
    typeof __webpack_require__ !== 'undefined' &&
    isWebpackRequireRuntime(__webpack_require__)
  ) {
    return __webpack_require__;
  }

  const runtime = (
    globalThis as typeof globalThis & {
      __webpack_require__?: WebpackRequireRuntime;
    }
  ).__webpack_require__;
  if (!isWebpackRequireRuntime(runtime)) {
    throw new Error(
      '[modern-js-v3:rsc-bridge] __webpack_require__ is unavailable while evaluating the internal bridge expose',
    );
  }

  return runtime as WebpackRequireRuntime;
};

const cacheActionReferencesFromExports = (
  exposedValue: unknown,
  visited: WeakSet<object>,
) => {
  if (
    typeof exposedValue === 'function' &&
    typeof (exposedValue as { $$id?: unknown }).$$id === 'string'
  ) {
    actionReferenceCache[(exposedValue as { $$id: string }).$$id] =
      exposedValue as (...args: unknown[]) => unknown;
  }

  if (!isObject(exposedValue)) {
    return;
  }
  if (visited.has(exposedValue)) {
    return;
  }
  visited.add(exposedValue);

  for (const value of Object.values(exposedValue)) {
    cacheActionReferencesFromExports(value, visited);
  }
};

const cacheActionIdsFromModuleFactories = (
  moduleFactories: Record<string, unknown>,
) => {
  for (const moduleFactory of Object.values(moduleFactories)) {
    if (!isFunction(moduleFactory)) {
      continue;
    }
    const matches = String(moduleFactory).match(ACTION_ID_PATTERN);
    if (!matches) {
      continue;
    }
    for (const actionId of matches) {
      actionIdFallbackCache[actionId] = true;
    }
  }
};

const scanExposedModulesForActions = async () => {
  if (scanPromise) {
    await scanPromise;
    if (scanHadErrors || Object.keys(actionReferenceCache).length === 0) {
      scanPromise = null;
      scanHadErrors = false;
    }
    return;
  }

  scanHadErrors = false;
  scanPromise = (async () => {
    let hadExposeScanError = false;
    const webpackRequire = getWebpackRequire();
    const moduleMap = webpackRequire.initializeExposesData?.moduleMap;
    if (isObject(moduleMap)) {
      for (const [exposeName, getFactory] of Object.entries(moduleMap)) {
        if (
          exposeName === BRIDGE_EXPOSE_NAME ||
          typeof getFactory !== 'function'
        ) {
          continue;
        }

        try {
          const maybeFactory = await getFactory();
          const exportsValue =
            typeof maybeFactory === 'function' ? maybeFactory() : maybeFactory;
          cacheActionReferencesFromExports(exportsValue, new WeakSet());
          if (isObject(exportsValue) && isObject(exportsValue.default)) {
            cacheActionReferencesFromExports(
              exportsValue.default,
              new WeakSet(),
            );
          }
        } catch {
          hadExposeScanError = true;
          // Ignore expose modules that fail to execute during scan.
        }
      }
    }

    if (isObject(webpackRequire.c)) {
      for (const moduleRecord of Object.values(webpackRequire.c)) {
        const moduleExports = isObject(moduleRecord)
          ? (moduleRecord as { exports?: unknown }).exports
          : undefined;
        cacheActionReferencesFromExports(moduleExports, new WeakSet());
      }
    }

    if (isObject(webpackRequire.m)) {
      cacheActionIdsFromModuleFactories(webpackRequire.m);
    }

    scanHadErrors = hadExposeScanError;
  })();

  await scanPromise;
  if (scanHadErrors || Object.keys(actionReferenceCache).length === 0) {
    scanPromise = null;
    scanHadErrors = false;
  }
};

export const getManifest = () => getWebpackRequire().rscM;

export const getActionIds = async () => {
  await scanExposedModulesForActions();
  const actionIds = new Set<string>([
    ...Object.keys(actionReferenceCache),
    ...Object.keys(actionIdFallbackCache),
  ]);
  return Array.from(actionIds);
};

export const executeAction = async (actionId: string, args: unknown[]) => {
  await scanExposedModulesForActions();
  const action = actionReferenceCache[actionId];
  if (typeof action !== 'function') {
    throw new Error(
      `[modern-js-v3:rsc-bridge] Missing remote action for id "${actionId}". Ensure it is reachable from a federated expose.`,
    );
  }
  return action(...(Array.isArray(args) ? args : []));
};
