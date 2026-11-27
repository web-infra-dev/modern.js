import {
  getInstance,
  helpers,
  type ModuleFederation,
} from '@module-federation/enhanced/runtime';
import { normalizeBasename } from '../location';
import {
  ApplicationsDiscoveryError,
  isSnapshotExpiredError,
  type SnapshotExpiredError,
} from './errors';
import {
  deriveMountId,
  isUrlLike,
  matchDynamicRoute,
  normalizeRoutePattern,
  validateRemoteRoutes,
} from './match';
import type {
  ApplicationRef,
  ApplicationsHooksModule,
  ApplicationsLifecycle,
  ApplicationsService,
  ApplicationsStoreOptions,
  DiscoverApplicationsOptions,
  DiscoverApplicationsResult,
  DiscoveredContext,
  DiscoveryContext,
  GlobalModuleInfo,
  RemoteRoute,
  SerializedApplicationsState,
} from './types';

const DEFAULT_MAX_DEPTH = 8;
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RELOADS = 2;
const DEFAULT_RELOAD_WINDOW_MS = 15_000;
const RELOAD_STORAGE_PREFIX = '__modern_mf_app_reload__:';

const DYNAMIC_SERVICE_REMOTES_SYMBOL = Symbol.for(
  'modern-js.mf.applications.service-remotes',
);

export interface DynamicServiceRemoteRecord {
  name: string;
  entry?: string;
  version?: string;
}

export function getDynamicServiceRemotes(): DynamicServiceRemoteRecord[] {
  const map = (globalThis as Record<symbol, unknown>)[
    DYNAMIC_SERVICE_REMOTES_SYMBOL
  ] as Map<string, DynamicServiceRemoteRecord> | undefined;
  return map ? [...map.values()] : [];
}

function recordDynamicServiceRemote(record: DynamicServiceRemoteRecord): void {
  const globalObj = globalThis as Record<symbol, unknown>;
  let map = globalObj[DYNAMIC_SERVICE_REMOTES_SYMBOL] as
    Map<string, DynamicServiceRemoteRecord> | undefined;
  if (!map) {
    map = new Map();
    globalObj[DYNAMIC_SERVICE_REMOTES_SYMBOL] = map;
  }
  map.set(record.name, record);
}

interface MountState {
  mountId: string;
  parentMountId?: string;
  consumer: ApplicationRef | null;
  basename: string;
  routesByTarget: Map<string, RemoteRoute[]>;
  matchedByTarget: Map<string, RemoteRoute | undefined>;
}

interface InFlightTask {
  controller: AbortController;
  callers: number;
  promise: Promise<DiscoverApplicationsResult>;
}

interface StagedLayer {
  mountId: string;
  parentMountId?: string;
  consumer: ApplicationRef | null;
  basename: string;
  routes: RemoteRoute[];
  matchedRoute?: RemoteRoute;
  moduleInfo?: GlobalModuleInfo;
}

function normalizeTarget(
  options: DiscoverApplicationsOptions | undefined,
  getLocation: () => { pathname: string; search: string },
): { pathname: string; search: string; key: string } {
  const current = getLocation();
  let pathname = options?.pathname ?? current.pathname ?? '/';
  let search =
    options?.search ??
    (options?.pathname !== undefined ? '' : (current.search ?? ''));

  if (pathname.includes('?') && options?.search === undefined) {
    const [pathPart, queryPart] = pathname.split('?', 2);
    pathname = pathPart || '/';
    search = queryPart ? `?${queryPart}` : '';
  }
  if (!pathname.startsWith('/')) {
    pathname = `/${pathname}`;
  }
  if (search && !search.startsWith('?')) {
    search = `?${search}`;
  }
  return {
    pathname,
    search,
    key: `${pathname}${search}`,
  };
}

function consumerKey(consumer: ApplicationRef | null): string {
  if (!consumer) return 'root';
  return `${consumer.moduleName}::${consumer.expose}::${consumer.versionOrUrl}`;
}

function resolveLifecycle(
  hooks?: ApplicationsHooksModule,
): ApplicationsLifecycle {
  if (!hooks) return {};
  return {
    onCommit: hooks.lifecycle?.onCommit ?? hooks.onCommit,
    onDiscard: hooks.lifecycle?.onDiscard ?? hooks.onDiscard,
    dehydrate: hooks.lifecycle?.dehydrate ?? hooks.dehydrate,
    hydrate: hooks.lifecycle?.hydrate ?? hooks.hydrate,
  };
}

function resolveLoadFn(hooks?: ApplicationsHooksModule) {
  if (!hooks) return undefined;
  return typeof hooks.default === 'function'
    ? hooks.default
    : typeof hooks.load === 'function'
      ? hooks.load
      : undefined;
}

function getEffectiveMountRoutes(mount: MountState): RemoteRoute[] {
  const byPattern = new Map<string, RemoteRoute>();
  for (const list of mount.routesByTarget.values()) {
    for (const route of list) {
      byPattern.set(normalizeRoutePattern(route.route), route);
    }
  }
  return [...byPattern.values()];
}

function hasVersionInModuleInfo(
  moduleInfo: GlobalModuleInfo | undefined,
  moduleName: string,
  version: string,
): boolean {
  const checkMap = (map: GlobalModuleInfo | undefined): boolean => {
    if (!map) return false;
    const direct = map[`${moduleName}:${version}`] ?? map[moduleName];
    if (direct && typeof direct === 'object') {
      if ('version' in direct && direct.version && direct.version !== version) {
        // Direct bare entry has a different version; keep scanning prefixed keys.
      } else {
        return true;
      }
    }
    for (const [key, value] of Object.entries(map)) {
      if (!value || typeof value !== 'object') continue;
      if (
        key === `${moduleName}:${version}` ||
        key.endsWith(`:${moduleName}:${version}`)
      ) {
        return true;
      }
    }
    return false;
  };
  if (checkMap(moduleInfo)) return true;
  try {
    return checkMap(helpers.global.getGlobalSnapshot() as GlobalModuleInfo);
  } catch {
    return false;
  }
}

function registerMFModules(
  instance: ModuleFederation | null | undefined,
  layers: readonly StagedLayer[],
  target: string,
): void {
  const mergedModuleInfo: GlobalModuleInfo = {};
  let hasModuleInfo = false;
  for (const layer of layers) {
    if (layer.moduleInfo && typeof layer.moduleInfo === 'object') {
      Object.assign(mergedModuleInfo, layer.moduleInfo);
      hasModuleInfo = true;
    }
  }

  // Validate all referenced routes before mutating global snapshot or remotes.
  const remotesToRegister = new Map<
    string,
    { name: string; entry?: string; version?: string; rawVersionOrUrl: string }
  >();
  for (const layer of layers) {
    for (const route of layer.routes) {
      const existing = remotesToRegister.get(route.moduleName);
      if (existing && existing.rawVersionOrUrl !== route.versionOrUrl) {
        throw new ApplicationsDiscoveryError(
          `Conflicting versions for module "${route.moduleName}" across discovered layers ("${existing.rawVersionOrUrl}" vs "${route.versionOrUrl}").`,
          {
            code: 'MODULE_CONFLICT',
            consumer: layer.consumer,
            mountId: layer.mountId,
            target,
          },
        );
      }
      if (isUrlLike(route.versionOrUrl)) {
        remotesToRegister.set(route.moduleName, {
          name: route.moduleName,
          entry: route.versionOrUrl,
          rawVersionOrUrl: route.versionOrUrl,
        });
      } else {
        if (
          !hasVersionInModuleInfo(
            hasModuleInfo ? mergedModuleInfo : undefined,
            route.moduleName,
            route.versionOrUrl,
          )
        ) {
          throw new ApplicationsDiscoveryError(
            `Cannot resolve version "${route.versionOrUrl}" for module "${route.moduleName}": missing snapshot metadata in moduleInfo.`,
            {
              code: 'UNRESOLVED_VERSION',
              consumer: layer.consumer,
              mountId: layer.mountId,
              target,
            },
          );
        }
        remotesToRegister.set(route.moduleName, {
          name: route.moduleName,
          version: route.versionOrUrl,
          rawVersionOrUrl: route.versionOrUrl,
        });
      }
    }
  }

  // Check against already registered remotes on the active MF instance.
  if (instance) {
    const existingRemotes = instance.options?.remotes || [];
    for (const candidate of remotesToRegister.values()) {
      const registered = existingRemotes.find(
        item => item.name === candidate.name || item.alias === candidate.name,
      );
      if (!registered) continue;
      if (
        candidate.entry &&
        'entry' in registered &&
        registered.entry &&
        registered.entry !== candidate.entry
      ) {
        throw new ApplicationsDiscoveryError(
          `Module "${candidate.name}" is already registered with entry "${registered.entry}" and conflicts with "${candidate.entry}".`,
          { code: 'MODULE_CONFLICT', target },
        );
      }
      if (
        candidate.version &&
        'version' in registered &&
        registered.version &&
        registered.version !== '*' &&
        registered.version !== candidate.version
      ) {
        throw new ApplicationsDiscoveryError(
          `Module "${candidate.name}" is already registered with version "${registered.version}" and conflicts with "${candidate.version}".`,
          { code: 'MODULE_CONFLICT', target },
        );
      }
    }
  }

  if (hasModuleInfo) {
    helpers.global.addGlobalSnapshot(mergedModuleInfo as any);
  }

  const newRemotes: Array<
    { name: string; entry: string } | { name: string; version: string }
  > = [];
  for (const candidate of remotesToRegister.values()) {
    recordDynamicServiceRemote({
      name: candidate.name,
      ...(candidate.entry ? { entry: candidate.entry } : {}),
      ...(candidate.version ? { version: candidate.version } : {}),
    });
    if (!instance) continue;
    const alreadyRegistered = (instance.options?.remotes || []).some(
      item => item.name === candidate.name || item.alias === candidate.name,
    );
    if (!alreadyRegistered) {
      if (candidate.entry) {
        newRemotes.push({ name: candidate.name, entry: candidate.entry });
      } else if (candidate.version) {
        newRemotes.push({ name: candidate.name, version: candidate.version });
      }
    }
  }

  if (instance && newRemotes.length > 0) {
    instance.registerRemotes(newRemotes);
  }
}

export interface ApplicationsStore {
  readonly autoGenerateRoute: boolean;
  readonly service: ApplicationsService;
  discoverApplications(
    options?: DiscoverApplicationsOptions,
  ): Promise<DiscoverApplicationsResult>;
  getRoutesForMount(mountId: string): readonly RemoteRoute[];
  getMountContext(mountId: string): DiscoveredContext | undefined;
  subscribe(listener: (mountIds: readonly string[]) => void): () => void;
  dehydrate(): SerializedApplicationsState | undefined;
  hydrate(state: SerializedApplicationsState): void;
  dispose(): void;
}

export function createApplicationsStore(
  options: ApplicationsStoreOptions,
): ApplicationsStore {
  const {
    hooks,
    autoGenerateRoute = true,
    isBrowser,
    rootBasename = '/',
    maxDepth = DEFAULT_MAX_DEPTH,
    timeoutMs: defaultTimeoutMs = DEFAULT_TIMEOUT_MS,
    maxReloads = DEFAULT_MAX_RELOADS,
    reloadWindowMs = DEFAULT_RELOAD_WINDOW_MS,
    getInstance: resolveInstance = () => getInstance(),
    reloadPage = () => {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    },
    getLocation = () =>
      typeof window !== 'undefined'
        ? { pathname: window.location.pathname, search: window.location.search }
        : { pathname: '/', search: '' },
    request,
    onDiagnostic,
  } = options;

  const loadFn = resolveLoadFn(hooks);
  const lifecycle = resolveLifecycle(hooks);
  const mounts = new Map<string, MountState>();
  const committedModuleInfo: GlobalModuleInfo = {};
  let hasCommittedModuleInfo = false;
  let lastTarget: { pathname: string; search: string } | undefined;
  const inFlight = new Map<string, InFlightTask>();
  const listeners = new Set<(mountIds: readonly string[]) => void>();
  const targetEpoch = new Map<string, number>();
  let txCounter = 0;
  let disposed = false;

  const notifyListeners = (mountIds: readonly string[]) => {
    for (const listener of listeners) {
      try {
        listener(mountIds);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const buildDiscoveredContext = (
    mount: MountState,
    targetKey?: string,
  ): DiscoveredContext => ({
    mountId: mount.mountId,
    parentMountId: mount.parentMountId,
    consumer: mount.consumer,
    basename: mount.basename,
    routes: Object.freeze(getEffectiveMountRoutes(mount)),
    matchedRoute: targetKey ? mount.matchedByTarget.get(targetKey) : undefined,
  });

  const getCachedChain = (
    pathname: string,
    search: string,
    targetKey: string,
  ): DiscoveredContext[] | undefined => {
    const rootMount = mounts.get('root');
    if (!rootMount || !rootMount.routesByTarget.has(targetKey)) {
      return undefined;
    }
    const contexts: DiscoveredContext[] = [];
    let currentMount: MountState | undefined = rootMount;
    const visited = new Set<string>();

    while (currentMount) {
      if (!currentMount.routesByTarget.has(targetKey)) {
        return undefined;
      }
      const routes = getEffectiveMountRoutes(currentMount);
      const matched = matchDynamicRoute(
        routes,
        pathname,
        currentMount.basename,
      );
      contexts.push({
        mountId: currentMount.mountId,
        parentMountId: currentMount.parentMountId,
        consumer: currentMount.consumer,
        basename: currentMount.basename,
        routes: Object.freeze(routes),
        matchedRoute: matched?.route,
      });

      if (!matched || !matched.route.discoverChildren) {
        break;
      }

      const nextMountId = deriveMountId(
        currentMount.mountId,
        matched.matchedBasename,
        matched.route.moduleName,
        matched.route.expose,
      );
      if (visited.has(nextMountId)) return undefined;
      visited.add(nextMountId);
      currentMount = mounts.get(nextMountId);
      if (!currentMount) {
        return undefined;
      }
    }

    return contexts;
  };

  const readReloadCounter = (targetKey: string): number => {
    if (!isBrowser || typeof sessionStorage === 'undefined') return 0;
    try {
      const raw = sessionStorage.getItem(
        `${RELOAD_STORAGE_PREFIX}${targetKey}`,
      );
      if (!raw) return 0;
      const parsed = JSON.parse(raw) as { count?: number; ts?: number };
      if (
        typeof parsed.ts === 'number' &&
        Date.now() - parsed.ts > reloadWindowMs
      ) {
        sessionStorage.removeItem(`${RELOAD_STORAGE_PREFIX}${targetKey}`);
        return 0;
      }
      return typeof parsed.count === 'number' ? parsed.count : 0;
    } catch {
      return 0;
    }
  };

  const incrementReloadCounter = (targetKey: string, nextCount: number) => {
    if (!isBrowser || typeof sessionStorage === 'undefined') return;
    try {
      sessionStorage.setItem(
        `${RELOAD_STORAGE_PREFIX}${targetKey}`,
        JSON.stringify({ count: nextCount, ts: Date.now() }),
      );
    } catch {
      // Ignore storage quota / private-mode restrictions.
    }
  };

  const handleSnapshotExpired = async (
    error: SnapshotExpiredError,
    ctx: {
      pathname: string;
      search: string;
      targetKey: string;
      mountId: string;
      consumer: ApplicationRef | null;
      depth: number;
      hookCalls: number;
      startedAt: number;
    },
  ): Promise<DiscoverApplicationsResult> => {
    if (!isBrowser) {
      onDiagnostic?.({
        target: ctx.targetKey,
        consumer: ctx.consumer,
        mountId: ctx.mountId,
        depth: ctx.depth,
        hookCalls: ctx.hookCalls,
        durationMs: Date.now() - ctx.startedAt,
        outcome: 'expired',
        reason: error.message,
      });
      throw error;
    }

    const reloadCount = readReloadCounter(ctx.targetKey);
    const decision = hooks?.onSnapshotExpired
      ? await hooks.onSnapshotExpired({
          reason: error.message,
          error,
          source: error.source,
          expectedSid: error.expectedSid,
          receivedSid: error.receivedSid,
          pathname: ctx.pathname,
          search: ctx.search,
          mountId: ctx.mountId,
          consumer: ctx.consumer,
          reloadCount,
        })
      : 'reload';

    if (decision === 'defer') {
      onDiagnostic?.({
        target: ctx.targetKey,
        consumer: ctx.consumer,
        mountId: ctx.mountId,
        depth: ctx.depth,
        hookCalls: ctx.hookCalls,
        durationMs: Date.now() - ctx.startedAt,
        outcome: 'deferred',
        reason: error.message,
      });
      // Preserve current page without mutating committed routes.
      const existing = [...mounts.values()].map(m =>
        buildDiscoveredContext(m, ctx.targetKey),
      );
      return {
        target: { pathname: ctx.pathname, search: ctx.search },
        contexts: Object.freeze(existing),
      };
    }

    if (reloadCount >= maxReloads) {
      onDiagnostic?.({
        target: ctx.targetKey,
        consumer: ctx.consumer,
        mountId: ctx.mountId,
        depth: ctx.depth,
        hookCalls: ctx.hookCalls,
        durationMs: Date.now() - ctx.startedAt,
        outcome: 'error',
        reason: 'reload-loop-prevented',
      });
      throw new ApplicationsDiscoveryError(
        `Snapshot expired repeatedly (${reloadCount} reloads within ${reloadWindowMs}ms); aborting reload to prevent an infinite loop.`,
        {
          code: 'RELOAD_LOOP',
          target: ctx.targetKey,
          consumer: ctx.consumer,
          mountId: ctx.mountId,
          depth: ctx.depth,
          cause: error,
        },
      );
    }

    incrementReloadCounter(ctx.targetKey, reloadCount + 1);
    onDiagnostic?.({
      target: ctx.targetKey,
      consumer: ctx.consumer,
      mountId: ctx.mountId,
      depth: ctx.depth,
      hookCalls: ctx.hookCalls,
      durationMs: Date.now() - ctx.startedAt,
      outcome: 'expired',
      reason: 'reloading',
    });
    reloadPage();
    // Stop committing stale data while the browser reloads.
    throw error;
  };

  const runDiscoveryChain = async (
    target: { pathname: string; search: string; key: string },
    cacheMode: 'default' | 'reload',
    controller: AbortController,
    timeoutMs: number,
  ): Promise<DiscoverApplicationsResult> => {
    const startedAt = Date.now();
    const transactionId = `tx_${++txCounter}_${startedAt}`;
    const epoch = (targetEpoch.get(target.key) || 0) + 1;
    targetEpoch.set(target.key, epoch);

    const stagedLayers: StagedLayer[] = [];
    let currentConsumer: ApplicationRef | null = null;
    let currentBasename = normalizeBasename(rootBasename);
    let currentMountId = 'root';
    let currentParentMountId: string | undefined;
    let depth = 0;
    let hookCalls = 0;
    const visitedChain = new Set<string>();
    let timedOut = false;

    const assertActive = () => {
      if (disposed) {
        throw new ApplicationsDiscoveryError(
          'Applications store has been disposed.',
          { code: 'ABORTED', target: target.key },
        );
      }
      if (timedOut) {
        throw new ApplicationsDiscoveryError(
          `Application discovery timed out after ${timeoutMs}ms for "${target.key}".`,
          {
            code: 'TIMEOUT',
            target: target.key,
            consumer: currentConsumer,
            mountId: currentMountId,
            depth,
          },
        );
      }
      if (controller.signal.aborted) {
        throw (
          controller.signal.reason ??
          new ApplicationsDiscoveryError(
            `Application discovery aborted for "${target.key}".`,
            {
              code: 'ABORTED',
              target: target.key,
              consumer: currentConsumer,
              mountId: currentMountId,
              depth,
            },
          )
        );
      }
    };

    const callWithTimeout = async <T>(work: Promise<T>): Promise<T> => {
      const remaining = timeoutMs - (Date.now() - startedAt);
      if (remaining <= 0) {
        timedOut = true;
        controller.abort();
        assertActive();
      }
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        return await Promise.race([
          work,
          new Promise<never>((_resolve, reject) => {
            timer = setTimeout(() => {
              timedOut = true;
              const timeoutError = new ApplicationsDiscoveryError(
                `Application discovery timed out after ${timeoutMs}ms for "${target.key}".`,
                {
                  code: 'TIMEOUT',
                  target: target.key,
                  consumer: currentConsumer,
                  mountId: currentMountId,
                  depth,
                },
              );
              controller.abort(timeoutError);
              reject(timeoutError);
            }, remaining);
          }),
        ]);
      } finally {
        if (timer !== undefined) clearTimeout(timer);
      }
    };

    try {
      while (true) {
        assertActive();
        if (depth >= maxDepth) {
          throw new ApplicationsDiscoveryError(
            `Application discovery exceeded max depth (${maxDepth}) while resolving "${target.key}".`,
            {
              code: 'MAX_DEPTH_EXCEEDED',
              target: target.key,
              consumer: currentConsumer,
              mountId: currentMountId,
              depth,
            },
          );
        }

        const visitKey = `${consumerKey(currentConsumer)}@${currentBasename}`;
        if (visitedChain.has(visitKey)) {
          throw new ApplicationsDiscoveryError(
            `Detected cyclic application discovery at "${visitKey}" while resolving "${target.key}".`,
            {
              code: 'CYCLE_DETECTED',
              target: target.key,
              consumer: currentConsumer,
              mountId: currentMountId,
              depth,
            },
          );
        }
        visitedChain.add(visitKey);

        if (!loadFn) {
          throw new ApplicationsDiscoveryError(
            `Application discovery requires a load() hook to resolve "${target.key}" (mount "${currentMountId}").`,
            {
              code: 'HOOK_MISSING',
              target: target.key,
              consumer: currentConsumer,
              mountId: currentMountId,
              depth,
            },
          );
        }

        const ctx: DiscoveryContext = {
          consumer: currentConsumer,
          pathname: target.pathname,
          search: target.search,
          basename: currentBasename,
          mountId: currentMountId,
          ...(currentParentMountId
            ? { parentMountId: currentParentMountId }
            : {}),
          transactionId,
          signal: controller.signal,
          ...(!isBrowser && request ? { request } : {}),
        };

        hookCalls += 1;
        const rawResult = await callWithTimeout(Promise.resolve(loadFn(ctx)));
        assertActive();

        if (!rawResult || typeof rawResult !== 'object') {
          throw new ApplicationsDiscoveryError(
            'Application discovery load() must return an object containing routes.',
            {
              code: 'INVALID_RESULT',
              target: target.key,
              consumer: currentConsumer,
              mountId: currentMountId,
              depth,
            },
          );
        }

        const validatedRoutes = validateRemoteRoutes(
          rawResult.routes,
          currentConsumer,
          currentMountId,
          target.key,
        );
        const matched = matchDynamicRoute(
          validatedRoutes,
          target.pathname,
          currentBasename,
        );

        stagedLayers.push({
          mountId: currentMountId,
          parentMountId: currentParentMountId,
          consumer: currentConsumer,
          basename: currentBasename,
          routes: validatedRoutes,
          matchedRoute: matched?.route,
          moduleInfo: rawResult.moduleInfo,
        });

        if (!matched || !matched.route.discoverChildren) {
          break;
        }

        const nextBasename = matched.matchedBasename;
        if (nextBasename === currentBasename && depth > 0) {
          throw new ApplicationsDiscoveryError(
            `Application discovery did not advance basename ("${currentBasename}") at module "${matched.route.moduleName}".`,
            {
              code: 'CYCLE_DETECTED',
              target: target.key,
              consumer: currentConsumer,
              mountId: currentMountId,
              depth,
            },
          );
        }

        currentParentMountId = currentMountId;
        currentMountId = deriveMountId(
          currentParentMountId,
          nextBasename,
          matched.route.moduleName,
          matched.route.expose,
        );
        currentConsumer = {
          moduleName: matched.route.moduleName,
          expose: matched.route.expose,
          versionOrUrl: matched.route.versionOrUrl,
        };
        currentBasename = nextBasename;
        depth += 1;
      }

      assertActive();

      // Superseded by a newer discovery on the same target: discard late results.
      if (targetEpoch.get(target.key) !== epoch) {
        throw new ApplicationsDiscoveryError(
          `Superseded discovery result for "${target.key}".`,
          { code: 'ABORTED', target: target.key, depth },
        );
      }

      // Register MF snapshots and remotes BEFORE committing store state.
      registerMFModules(resolveInstance(), stagedLayers, target.key);

      // Commit staged layers atomically.
      const touchedMounts: string[] = [];
      for (const layer of stagedLayers) {
        let mount = mounts.get(layer.mountId);
        if (!mount) {
          mount = {
            mountId: layer.mountId,
            parentMountId: layer.parentMountId,
            consumer: layer.consumer,
            basename: layer.basename,
            routesByTarget: new Map(),
            matchedByTarget: new Map(),
          };
          mounts.set(layer.mountId, mount);
        } else {
          mount.parentMountId = layer.parentMountId;
          mount.consumer = layer.consumer;
          mount.basename = layer.basename;
        }

        // On reload, if a route that previously matched this target is no
        // longer returned, revoke it from other cached target snapshots too so
        // stale mounts cannot continue matching this target.
        if (cacheMode === 'reload') {
          const previousMatch = mount.matchedByTarget.get(target.key);
          if (previousMatch) {
            const prevPattern = normalizeRoutePattern(previousMatch.route);
            const stillPresent = layer.routes.some(
              r => normalizeRoutePattern(r.route) === prevPattern,
            );
            if (!stillPresent) {
              for (const [cachedKey, cachedList] of mount.routesByTarget) {
                if (cachedKey === target.key) continue;
                const filtered = cachedList.filter(
                  r => normalizeRoutePattern(r.route) !== prevPattern,
                );
                if (filtered.length !== cachedList.length) {
                  mount.routesByTarget.set(cachedKey, filtered);
                }
              }
            }
          }
        }

        mount.routesByTarget.set(target.key, layer.routes);
        mount.matchedByTarget.set(target.key, layer.matchedRoute);
        touchedMounts.push(layer.mountId);

        if (layer.moduleInfo && typeof layer.moduleInfo === 'object') {
          Object.assign(committedModuleInfo, layer.moduleInfo);
          hasCommittedModuleInfo = true;
        }
      }

      lastTarget = { pathname: target.pathname, search: target.search };
      lifecycle.onCommit?.(transactionId);
      notifyListeners(touchedMounts);

      onDiagnostic?.({
        target: target.key,
        consumer: null,
        mountId: 'root',
        depth: stagedLayers.length,
        hookCalls,
        durationMs: Date.now() - startedAt,
        outcome: 'committed',
      });

      const contexts: DiscoveredContext[] = stagedLayers.map(layer => ({
        mountId: layer.mountId,
        parentMountId: layer.parentMountId,
        consumer: layer.consumer,
        basename: layer.basename,
        routes: Object.freeze([...layer.routes]),
        matchedRoute: layer.matchedRoute,
      }));

      return {
        target: { pathname: target.pathname, search: target.search },
        contexts: Object.freeze(contexts),
      };
    } catch (error) {
      try {
        lifecycle.onDiscard?.(transactionId, error);
      } catch (discardError) {
        console.error(discardError);
      }

      if (isSnapshotExpiredError(error)) {
        return handleSnapshotExpired(error, {
          pathname: target.pathname,
          search: target.search,
          targetKey: target.key,
          mountId: currentMountId,
          consumer: currentConsumer,
          depth,
          hookCalls,
          startedAt,
        });
      }

      onDiagnostic?.({
        target: target.key,
        consumer: currentConsumer,
        mountId: currentMountId,
        depth,
        hookCalls,
        durationMs: Date.now() - startedAt,
        outcome: controller.signal.aborted && !timedOut ? 'aborted' : 'error',
        reason: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const discoverApplications = async (
    callOptions?: DiscoverApplicationsOptions,
  ): Promise<DiscoverApplicationsResult> => {
    const target = normalizeTarget(callOptions, getLocation);
    const cacheMode = callOptions?.cache ?? 'default';
    const callerSignal = callOptions?.signal;
    const timeoutMs = callOptions?.timeoutMs ?? defaultTimeoutMs;

    if (callerSignal?.aborted) {
      throw (
        callerSignal.reason ??
        new ApplicationsDiscoveryError(
          `Application discovery aborted for "${target.key}".`,
          { code: 'ABORTED', target: target.key },
        )
      );
    }

    if (cacheMode === 'default') {
      const cached = getCachedChain(target.pathname, target.search, target.key);
      if (cached) {
        onDiagnostic?.({
          target: target.key,
          consumer: null,
          mountId: 'root',
          depth: cached.length,
          hookCalls: 0,
          durationMs: 0,
          outcome: 'cached',
        });
        return {
          target: { pathname: target.pathname, search: target.search },
          contexts: Object.freeze(cached),
        };
      }
    }

    const dedupeKey = cacheMode === 'default' ? target.key : undefined;
    let task = dedupeKey ? inFlight.get(dedupeKey) : undefined;
    if (!task) {
      const controller = new AbortController();
      const promise = runDiscoveryChain(
        target,
        cacheMode,
        controller,
        timeoutMs,
      ).finally(() => {
        if (dedupeKey && inFlight.get(dedupeKey) === task) {
          inFlight.delete(dedupeKey);
        }
      });
      // Prevent unhandled rejection when all callers abort and detach.
      void promise.catch(() => {});
      task = {
        controller,
        callers: 0,
        promise,
      };
      if (dedupeKey) {
        inFlight.set(dedupeKey, task);
      }
    }

    const activeTask = task;
    activeTask.callers += 1;

    if (!callerSignal) {
      return activeTask.promise.finally(() => {
        activeTask.callers = Math.max(0, activeTask.callers - 1);
      });
    }

    return new Promise<DiscoverApplicationsResult>((resolve, reject) => {
      let settled = false;
      const cleanup = () => {
        callerSignal.removeEventListener('abort', onAbort);
      };
      const onAbort = () => {
        if (settled) return;
        settled = true;
        cleanup();
        activeTask.callers = Math.max(0, activeTask.callers - 1);
        if (activeTask.callers === 0) {
          activeTask.controller.abort(callerSignal.reason);
        }
        reject(
          callerSignal.reason ??
            new ApplicationsDiscoveryError(
              `Application discovery aborted for "${target.key}".`,
              { code: 'ABORTED', target: target.key },
            ),
        );
      };
      callerSignal.addEventListener('abort', onAbort, { once: true });
      activeTask.promise.then(
        value => {
          if (settled) return;
          settled = true;
          cleanup();
          activeTask.callers = Math.max(0, activeTask.callers - 1);
          resolve(value);
        },
        error => {
          if (settled) return;
          settled = true;
          cleanup();
          activeTask.callers = Math.max(0, activeTask.callers - 1);
          reject(error);
        },
      );
    });
  };

  const getRoutesForMount = (mountId: string): readonly RemoteRoute[] => {
    const mount = mounts.get(mountId);
    return mount ? getEffectiveMountRoutes(mount) : [];
  };

  const getMountContext = (mountId: string): DiscoveredContext | undefined => {
    const mount = mounts.get(mountId);
    return mount ? buildDiscoveredContext(mount) : undefined;
  };

  const service: ApplicationsService = {
    discoverApplications,
    getRoutesForMount,
    getMountContext,
  };

  const dehydrate = (): SerializedApplicationsState | undefined => {
    if (!mounts.size) return undefined;
    const target = lastTarget ?? getLocation();
    const targetKey = `${target.pathname}${target.search}`;
    const contexts = [...mounts.values()].map(mount => ({
      mountId: mount.mountId,
      ...(mount.parentMountId ? { parentMountId: mount.parentMountId } : {}),
      consumer: mount.consumer,
      basename: mount.basename,
      routes: getEffectiveMountRoutes(mount),
      ...(mount.matchedByTarget.get(targetKey)
        ? { matchedRoute: mount.matchedByTarget.get(targetKey) }
        : {}),
    }));
    let lifecycleState: unknown;
    try {
      lifecycleState = lifecycle.dehydrate?.();
    } catch (error) {
      console.error(error);
    }
    return {
      version: 1,
      target,
      contexts,
      ...(hasCommittedModuleInfo ? { moduleInfo: committedModuleInfo } : {}),
      ...(lifecycleState !== undefined ? { lifecycleState } : {}),
    };
  };

  const hydrate = (state: SerializedApplicationsState): void => {
    if (!state || state.version !== 1 || !Array.isArray(state.contexts)) {
      return;
    }
    const targetKey = `${state.target.pathname}${state.target.search}`;
    const layers: StagedLayer[] = state.contexts.map((ctx, index) => ({
      mountId: ctx.mountId,
      parentMountId: ctx.parentMountId,
      consumer: ctx.consumer,
      basename: ctx.basename,
      routes: validateRemoteRoutes(
        ctx.routes,
        ctx.consumer,
        ctx.mountId,
        targetKey,
      ),
      matchedRoute: ctx.matchedRoute,
      moduleInfo: index === 0 ? state.moduleInfo : undefined,
    }));

    registerMFModules(resolveInstance(), layers, targetKey);

    const touched: string[] = [];
    for (const layer of layers) {
      mounts.set(layer.mountId, {
        mountId: layer.mountId,
        parentMountId: layer.parentMountId,
        consumer: layer.consumer,
        basename: layer.basename,
        routesByTarget: new Map([[targetKey, layer.routes]]),
        matchedByTarget: new Map([[targetKey, layer.matchedRoute]]),
      });
      touched.push(layer.mountId);
    }
    if (state.moduleInfo && typeof state.moduleInfo === 'object') {
      Object.assign(committedModuleInfo, state.moduleInfo);
      hasCommittedModuleInfo = true;
    }
    lastTarget = state.target;
    if (state.lifecycleState !== undefined) {
      lifecycle.hydrate?.(state.lifecycleState);
    }
    notifyListeners(touched);
  };

  const dispose = () => {
    disposed = true;
    for (const task of inFlight.values()) {
      task.controller.abort(new Error('Applications store disposed'));
    }
    inFlight.clear();
    listeners.clear();
  };

  return {
    autoGenerateRoute,
    service,
    discoverApplications,
    getRoutesForMount,
    getMountContext,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    dehydrate,
    hydrate,
    dispose,
  };
}
