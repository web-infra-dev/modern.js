import {
  generateSnapshotFromManifest,
  isManifestProvider,
  type Manifest,
} from '@module-federation/sdk';

export interface RemoteUpdateTarget {
  name: string;
  /** The registered manifest URL, not its resolved remoteEntry URL. */
  entry: string;
  type?: string;
  entryGlobalName?: string;
  client?: { entry: string; type?: string; entryGlobalName?: string };
  /** A fresh manifest or provider snapshot obtained by the caller. */
  moduleInfo?: Record<string, unknown>;
  /** Applied transitive builds, independent of this provider's own manifest. */
  dependencies?: { name: string; entry: string; buildVersion: string }[];
}
export interface RemoteCheckOptions {
  signal?: AbortSignal;
  revalidate?: boolean;
  /** @deprecated Diagnostic metadata only. Never used to order releases. */
  revision?: number;
}
export interface RemoteUpdateOptions extends RemoteCheckOptions {
  defer?: 'after-response';
}
export interface RemoteUpdateReceipt {
  operationId: string;
  revision: number;
  phase: 'scheduled' | 'pending' | 'applied';
}
export interface UpdateApplication {
  readonly status?: { phase: string; generation?: number };
  assertUpdateAllowed?(): void;
  defer?<T>(operation: () => Promise<T>): { completed: Promise<T> };
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, stable(v)]),
    );
  return value;
}
/** Select deployment data only. Runtime consumption bookkeeping is mutable. */
export function moduleInfoFingerprint(
  info: Record<string, unknown>,
  entry: string,
): string {
  const snapshot = (
    info.metaData
      ? generateSnapshotFromManifest(info as unknown as Manifest, {
          version: entry,
        })
      : info
  ) as Record<string, unknown>;
  if (
    typeof snapshot.remoteEntry !== 'string' ||
    !snapshot.remoteEntry ||
    isManifestProvider(snapshot as any)
  )
    throw new TypeError(
      'SSR update requires resolved provider module information',
    );
  const fields = [
    'providerName',
    'buildVersion',
    'globalName',
    'remoteEntry',
    'remoteEntryType',
    'ssrRemoteEntry',
    'ssrRemoteEntryType',
    'publicPath',
    'ssrPublicPath',
    'getPublicPath',
    'serviceBaseUrl',
  ];
  const picked: Record<string, unknown> = Object.fromEntries(
    fields.map(key => [key, snapshot[key]]),
  );
  picked.modules = (snapshot.modules as any[] | undefined)
    ?.map(item => ({
      moduleName: item.moduleName,
      modulePath: item.modulePath,
      assets: item.assets,
      render: item.render,
      servicePath: item.servicePath,
    }))
    .sort((a, b) => String(a.moduleName).localeCompare(String(b.moduleName)));
  picked.shared = (snapshot.shared as any[] | undefined)
    ?.map(item => ({
      sharedName: item.sharedName,
      version: item.version,
      assets: item.assets,
    }))
    .sort((a, b) => String(a.sharedName).localeCompare(String(b.sharedName)));
  return JSON.stringify(stable(picked));
}
function targetKey(target: RemoteUpdateTarget) {
  const { moduleInfo, ...registration } = target;
  return JSON.stringify(
    stable({
      ...registration,
      ...(moduleInfo
        ? { moduleInfo: moduleInfoFingerprint(moduleInfo, target.entry) }
        : {}),
    }),
  );
}
function aborted(signal?: AbortSignal) {
  signal?.throwIfAborted();
}
export async function readRemoteModuleInfo(
  target: RemoteUpdateTarget,
  options: RemoteCheckOptions = {},
) {
  aborted(options.signal);
  if (target.moduleInfo) return target.moduleInfo;
  // Candidate reads never enter the runtime snapshot loader or its cache.
  const response = await fetch(target.entry, {
    signal: options.signal,
    ...(options.revalidate ? { cache: 'no-store' as const } : {}),
  });
  if (!response.ok)
    throw new Error(
      `Remote manifest returned HTTP ${response.status}: ${target.entry}`,
    );
  const manifest = await response.json();
  aborted(options.signal);
  if (!manifest || typeof manifest !== 'object' || !manifest.metaData)
    throw new TypeError(`Invalid remote manifest: ${target.entry}`);
  // Validate the shape while the candidate is still unpublished.
  moduleInfoFingerprint(manifest, target.entry);
  return manifest as Record<string, unknown>;
}

/** Conditional candidates are service-local and never populate MF runtime caches. */
export function createRemoteManifestReader() {
  const cache = new Map<
    string,
    { moduleInfo: Record<string, unknown>; etag?: string; modified?: string }
  >();
  return async (
    target: RemoteUpdateTarget,
    options: RemoteCheckOptions = {},
  ) => {
    aborted(options.signal);
    if (target.moduleInfo) return target.moduleInfo;
    const previous = cache.get(target.entry);
    const headers = new Headers();
    if (previous?.etag) headers.set('If-None-Match', previous.etag);
    else if (previous?.modified)
      headers.set('If-Modified-Since', previous.modified);
    const response = await fetch(target.entry, {
      headers,
      signal: options.signal,
      cache: 'no-cache',
    });
    if (response.status === 304 && previous) return previous.moduleInfo;
    if (!response.ok)
      throw new Error(
        `Remote manifest returned HTTP ${response.status}: ${target.entry}`,
      );
    const moduleInfo = await response.json();
    aborted(options.signal);
    if (!moduleInfo || typeof moduleInfo !== 'object' || !moduleInfo.metaData)
      throw new TypeError(`Invalid remote manifest: ${target.entry}`);
    moduleInfoFingerprint(moduleInfo, target.entry);
    cache.set(target.entry, {
      moduleInfo,
      etag: response.headers.get('etag') || undefined,
      modified: response.headers.get('last-modified') || undefined,
    });
    return moduleInfo as Record<string, unknown>;
  };
}

export function createRemoteUpdateController<
  A extends UpdateApplication,
  R,
>(options: {
  maxPendingUpdates?: number;
  resolve(name: string): RemoteUpdateTarget | undefined;
  baseline(target: RemoteUpdateTarget): Record<string, unknown> | undefined;
  apply(
    application: A,
    targets: RemoteUpdateTarget[],
    onMutation: () => void,
    onStage: (stage: string) => void,
  ): Promise<R>;
}) {
  type Operation = {
    fingerprint: string;
    targets: RemoteUpdateTarget[];
    names: string[];
    operationId: string;
    revision: number;
    phase: 'scheduled' | 'pending' | 'applied' | 'failed';
    stage: string;
    mutationStarted: boolean;
    timingsMs: Record<string, number>;
    promise: Promise<any>;
    error?: unknown;
    appliedRevision?: number;
  };
  type State = {
    applied: Map<string, RemoteUpdateTarget>;
    pending: Map<string, Operation>;
    queue: Promise<unknown>;
    latest?: Operation;
    appliedRevision?: number;
    pendingCount: number;
  };
  const applications = new WeakMap<A, State>();
  let sequence = 0;
  const capacity = options.maxPendingUpdates ?? 32;
  if (!Number.isSafeInteger(capacity) || capacity < 0)
    throw new TypeError(
      'maxPendingUpdates must be a non-negative safe integer',
    );
  function stateFor(application: A) {
    let state = applications.get(application);
    if (!state) {
      state = {
        applied: new Map(),
        pending: new Map(),
        queue: Promise.resolve(),
        pendingCount: 0,
      };
      applications.set(application, state);
    }
    return state;
  }
  function capture(targets: RemoteUpdateTarget[]) {
    if (!targets.length)
      throw new TypeError(
        'Unique remote names and replacement entries are required',
      );
    const captured = targets
      .map(target => {
        if (!target.name || !target.entry)
          throw new TypeError(
            'Unique remote names and replacement entries are required',
          );
        if (target.moduleInfo)
          moduleInfoFingerprint(target.moduleInfo, target.entry);
        const registered = options.resolve(target.name);
        if (!registered)
          throw new Error(`Remote is not registered: ${target.name}`);
        return {
          ...target,
          name: registered.name,
          ...(target.moduleInfo
            ? { moduleInfo: structuredClone(target.moduleInfo) }
            : {}),
          ...(target.client ? { client: { ...target.client } } : {}),
          ...(target.dependencies
            ? { dependencies: structuredClone(target.dependencies) }
            : {}),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    if (new Set(captured.map(target => target.name)).size !== captured.length)
      throw new TypeError(
        'Unique remote names and replacement entries are required',
      );
    return captured;
  }
  function applied(state: State, target: RemoteUpdateTarget) {
    let current = state.applied.get(target.name);
    if (!current) {
      const registered = options.resolve(target.name)!;
      const info = registered.moduleInfo || options.baseline(registered);
      current = {
        ...registered,
        ...(info ? { moduleInfo: structuredClone(info) } : {}),
      };
      state.applied.set(target.name, current);
    }
    return current;
  }
  function registrationChanged(
    current: RemoteUpdateTarget,
    target: RemoteUpdateTarget,
  ) {
    if (current.entry !== target.entry) return true;
    if (
      target.client &&
      JSON.stringify(stable(target.client)) !==
        JSON.stringify(stable(current.client))
    )
      return true;
    if (
      (target.type !== undefined && target.type !== current.type) ||
      (target.entryGlobalName !== undefined &&
        target.entryGlobalName !== current.entryGlobalName)
    )
      return true;
    return false;
  }
  function targetChanged(
    current: RemoteUpdateTarget,
    target: RemoteUpdateTarget,
  ) {
    return (
      registrationChanged(current, target) ||
      dependenciesChanged(current, target) ||
      Boolean(
        target.moduleInfo &&
        (!current.moduleInfo ||
          moduleInfoFingerprint(current.moduleInfo, current.entry) !==
            moduleInfoFingerprint(target.moduleInfo, target.entry)),
      )
    );
  }
  function dependenciesChanged(
    current: RemoteUpdateTarget,
    target: RemoteUpdateTarget,
  ) {
    return (
      target.dependencies !== undefined &&
      JSON.stringify(stable(current.dependencies || [])) !==
        JSON.stringify(stable(target.dependencies))
    );
  }
  async function changed(
    state: State,
    target: RemoteUpdateTarget,
    input: RemoteCheckOptions,
  ) {
    aborted(input.signal);
    if (registrationChanged(applied(state, target), target)) return true;
    if (!target.moduleInfo && /\.json(?:[?#]|$)/.test(target.entry)) {
      const info = await readRemoteModuleInfo(target, input);
      target.moduleInfo = structuredClone(info);
    }
    return targetChanged(applied(state, target), target);
  }
  async function shouldUpdateRemote(
    application: A,
    target: RemoteUpdateTarget,
    input: RemoteCheckOptions = {},
  ) {
    const [captured] = capture([target]);
    const state = stateFor(application);
    aborted(input.signal);
    if (application.status?.phase === 'unavailable') return true;
    const intent = state.pending
      .get(captured.name)
      ?.targets.find(value => value.name === captured.name);
    if (
      intent &&
      (registrationChanged(intent, captured) ||
        dependenciesChanged(intent, captured) ||
        (intent.moduleInfo &&
          captured.moduleInfo &&
          moduleInfoFingerprint(intent.moduleInfo, intent.entry) !==
            moduleInfoFingerprint(captured.moduleInfo, captured.entry)))
    )
      return true;
    await changed(state, captured, input);
    aborted(input.signal);
    // Both publication and accepted intent can change while reading a candidate.
    // Recheck them together without another await or another manifest fetch.
    if (application.status?.phase === 'unavailable') return true;
    if (targetChanged(applied(state, captured), captured)) return true;
    const latestIntent = state.pending
      .get(captured.name)
      ?.targets.find(value => value.name === captured.name);
    return Boolean(
      latestIntent &&
      (registrationChanged(latestIntent, captured) ||
        dependenciesChanged(latestIntent, captured) ||
        !latestIntent.moduleInfo ||
        !captured.moduleInfo ||
        moduleInfoFingerprint(latestIntent.moduleInfo, latestIntent.entry) !==
          moduleInfoFingerprint(captured.moduleInfo, captured.entry)),
    );
  }
  function submit(
    application: A,
    targets: RemoteUpdateTarget[],
    input: RemoteUpdateOptions = {},
  ): Promise<any> | RemoteUpdateReceipt {
    let captured: RemoteUpdateTarget[], state: State;
    try {
      if (!input.defer) application.assertUpdateAllowed?.();
      if (input.defer && !application.defer)
        throw new Error(
          'Modern SSR application does not support deferred updates',
        );
      captured = capture(targets);
      aborted(input.signal);
      state = stateFor(application);
      // Capture the published baseline before a pending mutation can alter runtime registrations.
      for (const target of captured) applied(state, target);
    } catch (error) {
      if (input.defer) throw error;
      return Promise.reject(error);
    }
    const fingerprint = captured.map(targetKey).join('\n');
    const previous = state.pending.get(captured[0].name);
    const receipt = (operation: Operation): RemoteUpdateReceipt => ({
      operationId: operation.operationId,
      revision: operation.revision,
      phase: operation.phase === 'failed' ? 'scheduled' : operation.phase,
    });
    // Dedupe only the latest intent for EVERY remote. A -> B -> A must enqueue A.
    if (
      previous?.fingerprint === fingerprint &&
      // Same-URL notifications without a snapshot do not identify a release.
      // Reading them later may discover B -> A, so they cannot be deduplicated
      // synchronously with an earlier unknown candidate.
      captured.every(
        target =>
          target.moduleInfo || target.entry !== applied(state, target).entry,
      ) &&
      captured.every(target => state.pending.get(target.name) === previous)
    )
      return input.defer ? receipt(previous) : previous.promise;
    if (state.pendingCount >= capacity) {
      const error = new Error('SSR update queue is full');
      if (input.defer) throw error;
      return Promise.reject(error);
    }
    const revision = input.revision ?? ++sequence;
    const operation: Operation = {
      fingerprint,
      targets: captured,
      names: captured.map(target => target.name),
      operationId: `${revision}:${++sequence}`,
      revision,
      phase: input.defer ? 'scheduled' : 'pending',
      stage: input.defer ? 'after-response' : 'queue',
      mutationStarted: false,
      timingsMs: {},
      promise: undefined as any,
      appliedRevision: state.appliedRevision,
    };
    const predecessor = state.queue;
    const started = performance.now();
    let executing = false;
    const execute = async () => {
      await predecessor;
      aborted(input.signal);
      executing = true;
      operation.phase = 'pending';
      operation.stage = 'check';
      const candidates: RemoteUpdateTarget[] = [];
      for (const target of captured) {
        const needsUpdate = await changed(state, target, input);
        // URL changes are a fast check, but snapshot evidence is captured before publication.
        if (
          needsUpdate &&
          !target.moduleInfo &&
          /\.json(?:[?#]|$)/.test(target.entry)
        )
          target.moduleInfo = await readRemoteModuleInfo(target, input);
        if (needsUpdate) candidates.push(target);
      }
      aborted(input.signal);
      const recovering = application.status?.phase === 'unavailable';
      let result: R | undefined;
      if (candidates.length || recovering) {
        result = await options.apply(
          application,
          recovering ? captured : candidates,
          () => {
            operation.mutationStarted = true;
          },
          stage => {
            operation.stage = stage;
          },
        );
        for (const target of recovering ? captured : candidates)
          state.applied.set(target.name, {
            ...applied(state, target),
            ...target,
          });
        state.appliedRevision = revision;
      }
      operation.phase = 'applied';
      operation.stage = 'applied';
      operation.timingsMs.total = performance.now() - started;
      operation.appliedRevision = state.appliedRevision;
      return {
        ...result,
        changed: Boolean(candidates.length || recovering),
        revision,
        appliedRevision: state.appliedRevision,
        operationId: operation.operationId,
        timingsMs: { ...operation.timingsMs },
      };
    };
    // defer() can reject synchronously (capacity/request contract). Do not change accepted intent until it succeeds.
    let execution: Promise<any>;
    try {
      execution = input.defer
        ? application.defer!(execute).completed
        : Promise.resolve().then(execute);
    } catch (error) {
      if (input.defer) throw error;
      return Promise.reject(error);
    }
    const accepted = new Promise<any>((resolve, reject) => {
      const cancel = () => {
        if (!executing) reject(input.signal!.reason);
      };
      input.signal?.addEventListener('abort', cancel, { once: true });
      if (input.signal?.aborted) cancel();
      execution
        .then(resolve, reject)
        .finally(() => input.signal?.removeEventListener('abort', cancel));
    });
    operation.promise = accepted
      .catch(error => {
        operation.phase = 'failed';
        operation.error = error;
        operation.timingsMs.total = performance.now() - started;
        throw error;
      })
      .finally(() => {
        state.pendingCount--;
        for (const name of operation.names)
          if (state.pending.get(name) === operation) state.pending.delete(name);
      });
    state.pendingCount++;
    state.queue = Promise.all([predecessor, operation.promise.catch(() => {})]);
    state.latest = operation;
    for (const target of captured) state.pending.set(target.name, operation);
    if (input.defer) {
      void operation.promise.catch(() => {});
      return receipt(operation);
    }
    return operation.promise;
  }
  return {
    shouldUpdateRemote,
    async shouldUpdateRemotes(
      application: A,
      targets: RemoteUpdateTarget[],
      input?: RemoteCheckOptions,
    ) {
      for (const target of targets)
        if (await shouldUpdateRemote(application, target, input)) return true;
      return false;
    },
    updateRemotes: submit,
    /** Serialize the compatibility adapter through the same publication queue. */
    runExternal(
      application: A,
      targets: RemoteUpdateTarget[],
      operation: () => Promise<R>,
      schedule?: (execute: () => Promise<R>) => Promise<R>,
    ): Promise<R> {
      const state = stateFor(application);
      if (state.pendingCount >= capacity) {
        const error = new Error('SSR update queue is full');
        if (schedule) throw error;
        return Promise.reject(error);
      }
      const captured = targets.map(target => ({
        ...target,
        name: options.resolve(target.name)?.name || target.name,
      }));
      const pending: Operation = {
        fingerprint: `external:${++sequence}`,
        targets: captured,
        names: captured.map(target => target.name),
        operationId: `external:${sequence}`,
        revision: sequence,
        phase: 'pending',
        stage: 'queue',
        mutationStarted: false,
        timingsMs: {},
        promise: undefined as any,
      };
      const predecessor = state.queue;
      const execute = () => predecessor.then(operation);
      // Accept deferred scheduling before publishing this pending intent. A
      // rejected request/capacity admission must leave the prior queue intact.
      const execution = schedule ? schedule(execute) : execute();
      pending.promise = execution
        .then(result => {
          // Adopt the target at its actual publication boundary, never by revision.
          for (const target of captured) {
            const { moduleInfo: _old, ...previous } =
              state.applied.get(target.name) ||
              options.resolve(target.name) ||
              target;
            const info = target.moduleInfo || options.baseline(target);
            state.applied.set(target.name, {
              ...previous,
              ...target,
              ...(info ? { moduleInfo: structuredClone(info) } : {}),
            });
          }
          return result;
        })
        .finally(() => {
          state.pendingCount--;
          for (const name of pending.names)
            if (state.pending.get(name) === pending) state.pending.delete(name);
        });
      state.pendingCount++;
      for (const name of pending.names) state.pending.set(name, pending);
      state.queue = pending.promise.catch(() => {});
      return pending.promise;
    },
    async whenIdle(application: A) {
      await applications.get(application)?.queue;
    },
    status(application: A) {
      const state = applications.get(application);
      if (!state?.latest) return undefined;
      const {
        promise: _,
        fingerprint: __,
        names: ___,
        targets: ____,
        ...status
      } = state.latest;
      return {
        ...status,
        appliedRevision: state.appliedRevision,
        application: application.status,
      };
    },
  };
}
