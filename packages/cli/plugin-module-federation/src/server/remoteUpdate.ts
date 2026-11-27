import type { Manifest, ProviderModuleInfo } from '@module-federation/sdk';
import {
  isRawManifest,
  isResolvedProviderModuleInfo,
  manifestFingerprint,
  moduleInfoFingerprint,
  resolveTargetModuleInfo,
} from '@module-federation/node/lifecycle';
import { DEV_MANIFEST_WAIT_HEADER } from '../ssr-runtime/devManifestWait';
import {
  debugMFSSR,
  debugMFSSRVerbose,
  extractTargetVersion,
  isMFSSRDebugEnabled,
  isMFSSRVerboseDebugEnabled,
} from './ssrLogger';

export { manifestFingerprint, moduleInfoFingerprint };

export class RemoteManifestUnavailableError extends Error {}

export interface RemoteUpdateTarget {
  name: string;
  /** The registered manifest URL, not its resolved remoteEntry URL. */
  entry: string;
  type?: string;
  entryGlobalName?: string;
  client?: { entry: string; type?: string; entryGlobalName?: string };
  /** A fresh raw mf-manifest.json document obtained by the caller. */
  manifest?: Manifest;
  /** A resolved provider snapshot (ProviderModuleInfo) obtained by the caller. */
  moduleInfo?: ProviderModuleInfo;
  /** Applied transitive builds, independent of this provider's own manifest. */
  dependencies?: {
    name: string;
    entry: string;
    buildVersion: string;
  }[];
}
export interface RemoteCheckOptions {
  signal?: AbortSignal;
  revalidate?: boolean;
  /** @deprecated Diagnostic metadata only. Never used to order releases. */
  revision?: number;
}
export interface RemoteUpdateOptions extends RemoteCheckOptions {
  defer?: 'after-response';
  /** Diagnostic metadata identifying what initiated this update. */
  trigger?: string;
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

function candidateFingerprint(target: RemoteUpdateTarget): string | undefined {
  const resolved = resolveTargetModuleInfo({
    entry: target.entry,
    manifest: target.manifest,
    moduleInfo: target.moduleInfo,
  });
  return resolved ? moduleInfoFingerprint(resolved) : undefined;
}

function targetKey(target: RemoteUpdateTarget) {
  const { manifest: _m, moduleInfo: _i, ...registration } = target;
  const snapshotFingerprint = candidateFingerprint(target);
  return JSON.stringify(
    stable({
      ...registration,
      ...(snapshotFingerprint ? { snapshot: snapshotFingerprint } : {}),
    }),
  );
}
function aborted(signal?: AbortSignal) {
  signal?.throwIfAborted();
}
export async function readRemoteManifest(
  target: RemoteUpdateTarget,
  options: RemoteCheckOptions = {},
): Promise<Manifest> {
  aborted(options.signal);
  if (target.manifest) {
    manifestFingerprint(target.manifest, target.entry);
    return target.manifest;
  }
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
  if (!isRawManifest(manifest))
    throw new TypeError(`Invalid remote manifest: ${target.entry}`);
  // Validate the shape while the candidate is still unpublished.
  manifestFingerprint(manifest, target.entry);
  return manifest;
}

/** Conditional candidates are service-local and never populate MF runtime caches. */
export function createRemoteManifestReader({ waitForDevReady = false } = {}) {
  const cache = new Map<
    string,
    { manifest: Manifest; etag?: string; modified?: string }
  >();
  return async (
    target: RemoteUpdateTarget,
    options: RemoteCheckOptions = {},
  ): Promise<Manifest> => {
    aborted(options.signal);
    if (target.manifest) {
      manifestFingerprint(target.manifest, target.entry);
      return target.manifest;
    }
    const previous = cache.get(target.entry);
    const headers = new Headers();
    if (waitForDevReady) headers.set(DEV_MANIFEST_WAIT_HEADER, '1');
    if (previous?.etag) headers.set('If-None-Match', previous.etag);
    else if (previous?.modified)
      headers.set('If-Modified-Since', previous.modified);
    const maxAttempts = waitForDevReady ? 3 : 1;
    const trackTiming = isMFSSRDebugEnabled() || isMFSSRVerboseDebugEnabled();
    const started = trackTiming ? performance.now() : 0;
    let response!: Response;
    let manifest: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      response = await fetch(target.entry, {
        headers,
        signal: options.signal,
        cache: 'no-cache',
      });
      if (response.status === 304 && previous) {
        debugMFSSRVerbose('manifest-fetch', () => ({
          remote: target.name,
          status: 304,
          buildVersion: extractTargetVersion({ manifest: previous.manifest }),
          durationMs: started
            ? Math.round(performance.now() - started)
            : undefined,
        }));
        return previous.manifest;
      }
      if (!response.ok) {
        debugMFSSR('manifest-fetch', () => ({
          remote: target.name,
          status: response.status,
          attempt: attempt > 1 ? attempt : undefined,
          url: target.entry,
          durationMs: started
            ? Math.round(performance.now() - started)
            : undefined,
        }));
        throw new (
          response.status === 503 ? RemoteManifestUnavailableError : Error
        )(`Remote manifest returned HTTP ${response.status}: ${target.entry}`);
      }
      try {
        manifest = await response.json();
        break;
      } catch (error) {
        if (attempt >= maxAttempts || !(error instanceof SyntaxError))
          throw error;
        debugMFSSR('manifest-retry', () => ({
          remote: target.name,
          attempt,
          maxAttempts,
          url: target.entry,
        }));
        aborted(options.signal);
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => {
            options.signal?.removeEventListener('abort', onAbort);
            resolve();
          }, 50);
          const onAbort = () => {
            clearTimeout(timer);
            reject(options.signal?.reason);
          };
          options.signal?.addEventListener('abort', onAbort, { once: true });
        });
      }
    }
    aborted(options.signal);
    if (!isRawManifest(manifest))
      throw new TypeError(`Invalid remote manifest: ${target.entry}`);
    manifestFingerprint(manifest, target.entry);
    debugMFSSRVerbose('manifest-fetch', () => ({
      remote: target.name,
      status: response.status,
      buildVersion: extractTargetVersion({ manifest }),
      durationMs: started ? Math.round(performance.now() - started) : undefined,
    }));
    cache.set(target.entry, {
      manifest,
      etag: response.headers.get('etag') || undefined,
      modified: response.headers.get('last-modified') || undefined,
    });
    return manifest;
  };
}

function normalizeBaselineSnapshot(
  baseline: unknown,
): Pick<RemoteUpdateTarget, 'manifest' | 'moduleInfo'> {
  if (!baseline || typeof baseline !== 'object') return {};
  if (isRawManifest(baseline)) return { manifest: structuredClone(baseline) };
  if (isResolvedProviderModuleInfo(baseline))
    return { moduleInfo: structuredClone(baseline) };
  return {};
}

export interface RemoteApplyContext<A extends UpdateApplication> {
  application: A;
  operationId: string;
  revision: number;
  trigger?: string;
  previousTargets: ReadonlyMap<string, RemoteUpdateTarget>;
}

export function createRemoteUpdateController<
  A extends UpdateApplication,
  R,
>(options: {
  maxPendingUpdates?: number;
  resolve(name: string): RemoteUpdateTarget | undefined;
  baseline(target: RemoteUpdateTarget): unknown;
  apply(
    application: A,
    targets: RemoteUpdateTarget[],
    onMutation: () => void,
    onStage: (stage: string) => void,
    context: RemoteApplyContext<A>,
  ): Promise<R>;
  onApplied?(info: {
    application: A;
    targets: RemoteUpdateTarget[];
    result: R;
    operationId: string;
    revision: number;
    trigger?: string;
    timingsMs: Record<string, number>;
  }): void;
  onError?(info: {
    application: A;
    targets: RemoteUpdateTarget[];
    operationId: string;
    revision: number;
    trigger?: string;
    failedStage: string;
    mutationStarted: boolean;
    timingsMs: Record<string, number>;
    error: unknown;
  }): void;
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
        resolveTargetModuleInfo({
          entry: target.entry,
          manifest: target.manifest,
          moduleInfo: target.moduleInfo,
        });
        const registered = options.resolve(target.name);
        if (!registered)
          throw new Error(`Remote is not registered: ${target.name}`);
        return {
          ...target,
          name: registered.name,
          ...(target.manifest
            ? { manifest: structuredClone(target.manifest) }
            : {}),
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
      const fromBaseline =
        !registered.manifest && !registered.moduleInfo
          ? normalizeBaselineSnapshot(options.baseline(registered))
          : {};
      current = {
        ...registered,
        ...(registered.manifest
          ? { manifest: structuredClone(registered.manifest) }
          : {}),
        ...(registered.moduleInfo
          ? { moduleInfo: structuredClone(registered.moduleInfo) }
          : {}),
        ...fromBaseline,
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
  function changeReason(
    current: RemoteUpdateTarget,
    target: RemoteUpdateTarget,
  ): 'entry' | 'deps' | 'version' | undefined {
    if (registrationChanged(current, target)) return 'entry';
    if (dependenciesChanged(current, target)) return 'deps';
    const nextFp = candidateFingerprint(target);
    const currentFp = candidateFingerprint(current);
    if (nextFp && (!currentFp || currentFp !== nextFp)) return 'version';
    return undefined;
  }
  function targetChanged(
    current: RemoteUpdateTarget,
    target: RemoteUpdateTarget,
  ) {
    return Boolean(changeReason(current, target));
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
  function mergeAppliedTarget(
    previous: RemoteUpdateTarget,
    next: RemoteUpdateTarget,
  ): RemoteUpdateTarget {
    const merged: RemoteUpdateTarget = { ...previous, ...next };
    if (next.manifest !== undefined && next.moduleInfo === undefined)
      delete merged.moduleInfo;
    else if (next.moduleInfo !== undefined && next.manifest === undefined)
      delete merged.manifest;
    return merged;
  }
  async function changed(
    state: State,
    target: RemoteUpdateTarget,
    input: RemoteCheckOptions,
  ) {
    aborted(input.signal);
    if (registrationChanged(applied(state, target), target)) return true;
    if (
      !target.manifest &&
      !target.moduleInfo &&
      /\.json(?:[?#]|$)/.test(target.entry)
    ) {
      const manifest = await readRemoteManifest(target, input);
      target.manifest = structuredClone(manifest);
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
    const reportCheck = (changed: boolean, reason: string) => {
      const emit = changed ? debugMFSSR : debugMFSSRVerbose;
      emit('check-remote', () => {
        const current = applied(state, captured);
        return {
          remote: captured.name,
          changed,
          reason,
          fromVer: extractTargetVersion(current),
          toVer: extractTargetVersion(captured),
        };
      });
      return changed;
    };
    if (application.status?.phase === 'unavailable')
      return reportCheck(true, 'unavailable');
    const intent = state.pending
      .get(captured.name)
      ?.targets.find(value => value.name === captured.name);
    const capturedFp = candidateFingerprint(captured);
    const intentFp = intent ? candidateFingerprint(intent) : undefined;
    if (
      intent &&
      (registrationChanged(intent, captured) ||
        dependenciesChanged(intent, captured) ||
        Boolean(intentFp && capturedFp && intentFp !== capturedFp))
    )
      return reportCheck(true, 'pending-intent');
    await changed(state, captured, input);
    aborted(input.signal);
    // Both publication and accepted intent can change while reading a candidate.
    // Recheck them together without another await or another manifest fetch.
    if (application.status?.phase === 'unavailable')
      return reportCheck(true, 'unavailable');
    const reason = changeReason(applied(state, captured), captured);
    if (reason) return reportCheck(true, reason);
    const latestIntent = state.pending
      .get(captured.name)
      ?.targets.find(value => value.name === captured.name);
    const latestIntentFp = latestIntent
      ? candidateFingerprint(latestIntent)
      : undefined;
    const finalCapturedFp = candidateFingerprint(captured);
    const intentDiffers = Boolean(
      latestIntent &&
      (registrationChanged(latestIntent, captured) ||
        dependenciesChanged(latestIntent, captured) ||
        !latestIntentFp ||
        !finalCapturedFp ||
        latestIntentFp !== finalCapturedFp),
    );
    return reportCheck(
      intentDiffers,
      intentDiffers ? 'pending-intent' : 'unchanged',
    );
  }
  function submit(
    application: A,
    targets: RemoteUpdateTarget[],
    input: RemoteUpdateOptions = {},
  ): Promise<any> | RemoteUpdateReceipt {
    const reportReject = (
      error: unknown,
      failedTargets: RemoteUpdateTarget[],
      operationId = 'enqueue',
      revision = input.revision ?? 0,
    ) => {
      if (input.signal?.aborted) {
        debugMFSSR('update-aborted', () => ({
          remotes: failedTargets.map(target => target.name).filter(Boolean),
          stage: 'queue',
          op: operationId,
        }));
        return;
      }
      options.onError?.({
        application,
        targets: failedTargets,
        operationId,
        revision,
        trigger: input.trigger,
        failedStage: 'queue',
        mutationStarted: false,
        timingsMs: {},
        error,
      });
    };
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
      reportReject(error, Array.isArray(targets) ? targets : []);
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
          Boolean(target.manifest || target.moduleInfo) ||
          target.entry !== applied(state, target).entry,
      ) &&
      captured.every(target => state.pending.get(target.name) === previous)
    )
      return input.defer ? receipt(previous) : previous.promise;
    if (state.pendingCount >= capacity) {
      const error = new Error('SSR update queue is full');
      reportReject(error, captured);
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
    let stageStarted = started;
    const advanceStage = (nextStage: string) => {
      const now = performance.now();
      operation.timingsMs[operation.stage] =
        (operation.timingsMs[operation.stage] || 0) + now - stageStarted;
      stageStarted = now;
      operation.stage = nextStage;
    };
    let executing = false;
    let activeTargetsForLog: RemoteUpdateTarget[] = captured;
    const execute = async () => {
      await predecessor;
      aborted(input.signal);
      executing = true;
      operation.phase = 'pending';
      advanceStage('check');
      const candidates: RemoteUpdateTarget[] = [];
      for (const target of captured) {
        const needsUpdate = await changed(state, target, input);
        // URL changes are a fast check, but snapshot evidence is captured before publication.
        if (
          needsUpdate &&
          !target.manifest &&
          !target.moduleInfo &&
          /\.json(?:[?#]|$)/.test(target.entry)
        )
          target.manifest = await readRemoteManifest(target, input);
        if (needsUpdate) candidates.push(target);
      }
      aborted(input.signal);
      const recovering = application.status?.phase === 'unavailable';
      let result: R | undefined;
      if (candidates.length || recovering) {
        const previousTargets = new Map<string, RemoteUpdateTarget>();
        const activeTargets = (recovering ? captured : candidates).map(
          target => {
            const current = applied(state, target);
            previousTargets.set(target.name, current);
            if (!target.manifest && !target.moduleInfo) {
              return {
                ...target,
                ...(current.manifest
                  ? { manifest: structuredClone(current.manifest) }
                  : {}),
                ...(current.moduleInfo
                  ? { moduleInfo: structuredClone(current.moduleInfo) }
                  : {}),
              };
            }
            return target;
          },
        );
        activeTargetsForLog = activeTargets;
        result = await options.apply(
          application,
          activeTargets,
          () => {
            operation.mutationStarted = true;
          },
          advanceStage,
          {
            application,
            operationId: operation.operationId,
            revision,
            trigger: input.trigger,
            previousTargets,
          },
        );
        for (const target of activeTargets)
          state.applied.set(
            target.name,
            mergeAppliedTarget(applied(state, target), target),
          );
        state.appliedRevision = revision;
      }
      operation.phase = 'applied';
      advanceStage('applied');
      operation.timingsMs.total = performance.now() - started;
      operation.appliedRevision = state.appliedRevision;
      if (result !== undefined) {
        options.onApplied?.({
          application,
          targets: activeTargetsForLog,
          result,
          operationId: operation.operationId,
          revision,
          trigger: input.trigger,
          timingsMs: { ...operation.timingsMs },
        });
      }
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
      reportReject(error, captured, operation.operationId, revision);
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
        const failedStage = operation.stage;
        advanceStage('failed');
        operation.phase = 'failed';
        operation.error = error;
        operation.timingsMs.total = performance.now() - started;
        if (input.signal?.aborted) {
          debugMFSSR('update-aborted', () => ({
            remotes: activeTargetsForLog.map(target => target.name),
            stage: failedStage,
            op: operation.operationId,
          }));
        } else {
          options.onError?.({
            application,
            targets: activeTargetsForLog,
            operationId: operation.operationId,
            revision,
            trigger: input.trigger,
            failedStage,
            mutationStarted: operation.mutationStarted,
            timingsMs: { ...operation.timingsMs },
            error,
          });
        }
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
    recordApplied(application: A, targets: RemoteUpdateTarget[]) {
      const state = stateFor(application);
      for (const target of targets) {
        const canonical = options.resolve(target.name)?.name || target.name;
        const normalized = { ...target, name: canonical };
        state.applied.set(
          canonical,
          mergeAppliedTarget(applied(state, normalized), normalized),
        );
      }
      state.appliedRevision = ++sequence;
    },
    getApplied(application: A, name: string): RemoteUpdateTarget | undefined {
      const state = applications.get(application);
      const canonical = options.resolve(name)?.name || name;
      return state?.applied.get(canonical);
    },
    /** Serialize the compatibility adapter through the same publication queue. */
    runExternal<T = R>(
      application: A,
      targets: RemoteUpdateTarget[],
      operation: () => Promise<T>,
      schedule?: (execute: () => Promise<T>) => Promise<T>,
    ): Promise<T> {
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
            const {
              manifest: _oldManifest,
              moduleInfo: _oldInfo,
              ...previous
            } = state.applied.get(target.name) ||
            options.resolve(target.name) ||
            target;
            const fromBaseline =
              !target.manifest && !target.moduleInfo
                ? normalizeBaselineSnapshot(options.baseline(target))
                : {};
            state.applied.set(
              target.name,
              mergeAppliedTarget(previous, {
                ...target,
                ...fromBaseline,
              }),
            );
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
