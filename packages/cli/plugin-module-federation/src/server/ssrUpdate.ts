import {
  setSSRUpdateCandidates,
  clearSSRUpdateCandidates,
  getSSRUpdateRegistration,
} from './ssrUpdateCandidates';
import {
  createRemoteUpdateController,
  type RemoteCheckOptions,
} from './remoteUpdate';
import {
  clientRemote,
  releaseScript,
  type SSRClientRemote,
} from '../ssr-runtime/release';
import { helpers } from '@module-federation/enhanced/runtime';
import {
  bindSSRRuntime,
  createSSRUpdateOwner,
  runWithSSRUpdateOwner,
  releaseSSRUpdateOwner,
  type SSRUpdateOwner,
} from './ssrUpdateOwner';

/** This protocol is owned by the Modern adapter, not the generic MF runtime. */
export interface SSREntryRecord {
  application: string;
  applicationOwner?: string;
  readonly buildId?: string;
  entry: string;
  owner: string;
  rootIds: Array<string | number | null>;
  remoteNames: string[];
  chunks: Array<string | number>;
  reasons: string[];
  runtime: any;
  load(): unknown;
}
export type SSRUpdatePlan = {
  mode: 'entries' | 'application';
  entries?: string[];
  reasons: string[];
};

export interface SSRRemoteReplacement {
  name: string;
  entry: string;
  type?: string;
  entryGlobalName?: string;
  client?: Omit<SSRClientRemote, 'name'>;
  moduleInfo?: Record<string, unknown>;
  /** Development subscriptions retain transitive build identities separately. */
  dependencies?: { name: string; entry: string; buildVersion: string }[];
}
export interface SSRUpdateOptions extends RemoteCheckOptions {
  revision?: number;
  /** Submit from SSR without waiting for the response that must drain first. */
  defer?: 'after-response';
}
export interface SSRUpdateReceipt {
  operationId: string;
  revision: number;
  phase: 'scheduled' | 'pending' | 'applied';
}

/**
 * Opt-in contract: all request-side MF consumption uses compiled static imports,
 * entry middleware cannot consume another entry, and mutations use this owner.
 * Dynamic/mixed applications must leave staticOnly disabled.
 */
export function createSSRUpdateAdapter(options: {
  name: string;
  entries: string[];
  owner?: SSRUpdateOwner;
  staticOnly?: boolean;
  /** Immutable public entries paired with the initial server release. */
  hydration?: { remotes: SSRClientRemote[] };
  remotes?: SSRRemoteReplacement[];
  maxPendingUpdates?: number;
  invalidate?: (remotes: SSRRemoteReplacement[]) => Promise<void>;
}) {
  options = { ...options, entries: [...options.entries] };
  const owner =
    options.owner || createSSRUpdateOwner(options.name, options.entries);
  for (const entry of options.entries) {
    owner.entryNames.add(entry);
    owner.entryNames.add(`${entry}-server-loaders`);
  }
  const clientTargets = new Map(
    options.hydration?.remotes.map(value => {
      const remote = clientRemote(value);
      return [remote.name, remote] as const;
    }),
  );
  let targetRevision = 0;
  let hydrationEnabled = Boolean(options.hydration);
  const records = () => [...owner.entries.values()];
  const instances = () => [
    ...new Set(
      [
        ...records().map(record => record.runtime.federation?.instance),
        ...owner.instances,
      ].filter(Boolean),
    ),
  ];
  const states = () =>
    instances().map(
      instance => instance[Symbol.for('modern-js.mf.ssr.consumption')],
    );
  const registrations = new WeakMap<object, Map<string, any>>();
  const retiringProviders = new Set<any>();
  const dependencyGraphs = new Map(
    options.remotes?.map(remote => [remote.name, remote.dependencies || []]),
  );
  const canonicalName = (name: string) => {
    for (const instance of instances()) {
      const remote =
        instance.options?.remotes.find(
          (item: any) => item.name === name || item.alias === name,
        ) ||
        [...(registrations.get(instance)?.values() || [])].find(
          (item: any) => item.name === name || item.alias === name,
        );
      if (remote) return remote.name as string;
    }
    return name;
  };
  const canonicalClientTargets = () =>
    new Map(
      [...clientTargets.values()].map(remote => {
        const name = canonicalName(remote.name);
        return [name, { ...remote, name }] as const;
      }),
    );
  const plan = (remote: string): SSRUpdatePlan => {
    const all = records();
    const reasons = new Set<string>();
    if (!options.staticOnly) reasons.add('dynamic-or-mixed-consumption');
    if (!states().length || states().some(state => !state))
      reasons.add('missing-consumption-tracker');
    if (states().some(state => state?.dynamic))
      reasons.add('runtime-consumption-observed');
    if (
      !options.entries.length ||
      options.entries.some(entry => !all.some(record => record.owner === entry))
    )
      reasons.add('missing-entry-metadata');
    if (all.some(record => !options.entries.includes(record.owner)))
      reasons.add('unknown-entry-metadata');
    for (const record of all)
      for (const reason of record.reasons) reasons.add(reason);
    const targets = all.filter(record => record.remoteNames.includes(remote));
    if (!targets.length) reasons.add('remote-not-in-static-graph');
    // Native metadata is required even if compilation found a remote chunk.
    for (const record of targets) {
      const data = record.runtime.remotesLoadingData;
      if (
        !data?.remoteKeyToRemoteModuleIds?.[remote]?.length ||
        !data.remoteModuleIdToConsumerModuleIds ||
        !data.consumerModuleIdToParentModuleIds
      )
        reasons.add('missing-native-invalidation-graph');
      else {
        const queue: Array<string | number> = data.remoteKeyToRemoteModuleIds[
          remote
        ].flatMap(
          (id: string | number) =>
            data.remoteModuleIdToConsumerModuleIds[id] || [],
        );
        const affected = new Set<string>();
        for (let index = 0; index < queue.length; index++) {
          const id = queue[index];
          if (affected.has(String(id))) continue;
          affected.add(String(id));
          queue.push(...(data.consumerModuleIdToParentModuleIds[id] || []));
        }
        if (
          !record.rootIds.every(id => id !== null && affected.has(String(id)))
        )
          reasons.add('incomplete-parent-closure');
      }
    }
    if (reasons.size) return { mode: 'application', reasons: [...reasons] };
    const owners = new Set(targets.map(record => record.owner));
    // Entries sharing a bundler runtime share its caches and must drain together.
    let changed = true;
    while (changed) {
      changed = false;
      const runtimes = new Set(
        all
          .filter(record => owners.has(record.owner))
          .map(record => record.runtime),
      );
      for (const record of all)
        if (runtimes.has(record.runtime) && !owners.has(record.owner)) {
          owners.add(record.owner);
          changed = true;
        }
    }
    if ([...owners].some(owner => !options.entries.includes(owner)))
      return { mode: 'application', reasons: ['unknown-runtime-owner'] };
    return { mode: 'entries', entries: [...owners].sort(), reasons: [] };
  };
  type Replacement = Omit<SSRRemoteReplacement, 'name'>;
  type Change = { name: string; replacement: Replacement };
  async function performUpdate(
    application: {
      readonly status?: { phase: string };
      assertUpdateAllowed?(): void;
      defer?<T>(operation: () => Promise<T>): { completed: Promise<T> };
      update(
        invalidate: (entries?: readonly string[]) => Promise<void>,
        scope?: () => readonly string[] | undefined,
      ): Promise<number>;
    },
    changes: Change[],
    onMutation: () => void,
    onStage: (stage: string) => void,
  ) {
    let selected: SSRUpdatePlan = { mode: 'application', reasons: [] };
    let recovering = false;
    const token = {};
    const ownedStates = new Set<any>();
    try {
      const execute = () =>
        application.update(
          async entries => {
            onStage('clear');
            setSSRUpdateCandidates(
              owner.id,
              changes.map(({ name, replacement }) => ({
                ...replacement,
                name: canonicalName(name),
              })),
            );
            await options.invalidate?.(
              changes.map(({ name, replacement }) => ({
                name,
                ...replacement,
              })),
            );
            if (!entries && selected.mode === 'entries')
              selected = {
                mode: 'application',
                reasons: ['application-scope-required'],
              };
            if (recovering)
              selected = {
                mode: 'application',
                reasons: ['failed-update-recovery'],
              };
            for (const state of ownedStates) state.selective = Boolean(entries);
            const hosts = instances();
            if (!hosts.length) {
              const previous =
                owner.registrations ||
                options.remotes?.map(remote => ({
                  ...remote,
                  ...getSSRUpdateRegistration(owner.id, remote.name),
                }));
              if (!previous) throw new Error('Missing MF application instance');
              const targets = new Map(
                previous.map(remote => [remote.name, remote]),
              );
              for (const { name, replacement } of changes) {
                const existing = previous.find(
                  remote => remote.name === name || remote.alias === name,
                );
                const {
                  client: _client,
                  moduleInfo: _info,
                  dependencies: _dependencies,
                  ...server
                } = replacement;
                targets.set(existing?.name || name, {
                  ...existing,
                  ...server,
                  name: existing?.name || name,
                });
              }
              owner.registrations = [...targets.values()];
              onMutation();
              onStage('rebuild');
              return;
            }
            const outcomes = await Promise.allSettled(
              hosts.map(async instance => {
                const next = changes.map(({ name, replacement }) => {
                  const registered = instance.options.remotes.find(
                    (remote: any) =>
                      remote.name === name || remote.alias === name,
                  );
                  let remembered = registrations.get(instance);
                  if (!remembered) {
                    remembered = new Map();
                    registrations.set(instance, remembered);
                  }
                  const previous = registered ||
                    remembered.get(name) || { name };
                  const {
                    client: _client,
                    moduleInfo: _info,
                    dependencies: _dependencies,
                    ...serverReplacement
                  } = replacement;
                  const target = {
                    ...previous,
                    ...serverReplacement,
                    name: previous.name,
                    alias: previous.alias,
                  };
                  // Retain the intended registration even if mutation removes it.
                  remembered.set(name, target);
                  return target;
                });
                const state =
                  instance[Symbol.for('modern-js.mf.ssr.consumption')];
                const replace = async () => {
                  onMutation();
                  const targets =
                    recovering || !entries
                      ? [
                          ...new Map(
                            [
                              ...registrations.get(instance)!.values(),
                              ...next,
                            ].map(remote => [remote.name, remote]),
                          ).values(),
                        ]
                      : next;
                  // Full application disposal follows invalidation. Capture the
                  // provider objects before Core/bundler hooks detach them from
                  // both the host cache and the global instance registry.
                  if (!entries) {
                    const known = [
                      ...((globalThis as any).__FEDERATION__?.__INSTANCES__ ||
                        []),
                      ...(instance.retainedProviders || []),
                      ...retiringProviders,
                    ];
                    for (const target of targets) {
                      const module = instance.moduleCache?.get(target.name);
                      if (!module) continue;
                      const provider =
                        helpers.global.getRemoteFederationInstance(
                          module.remoteInfo,
                          known,
                          module.remoteEntryExports || module.lib,
                        );
                      if (provider) retiringProviders.add(provider);
                    }
                  }
                  await instance.updateRemotes(targets);
                };
                if (state) await state.context.run(token, replace);
                else await replace();
              }),
            );
            const failures = outcomes.filter(
              result => result.status === 'rejected',
            );
            if (failures.length)
              throw new AggregateError(
                failures.map(result => result.reason),
                'SSR remote replacement failed',
              );
            onStage('rebuild');
          },
          () => {
            onStage('analyze');
            const hosts = instances();
            if (!hosts.length && !owner.registrations && !options.remotes)
              throw new Error('Missing MF application instance');
            recovering = application.status?.phase === 'unavailable';
            for (const instance of hosts) {
              const names = changes.map(({ name }) => {
                const existing =
                  instance.options.remotes.find(
                    (remote: any) =>
                      remote.name === name || remote.alias === name,
                  ) || registrations.get(instance)?.get(name);
                if (
                  !existing &&
                  instance.options.remotes.some(
                    (remote: any) =>
                      remote.alias && name.startsWith(remote.alias),
                  )
                )
                  throw new Error(
                    `Remote name conflicts with a registered alias: ${name}`,
                  );
                return existing?.name || name;
              });
              if (new Set(names).size !== names.length)
                throw new Error('Multiple replacements target the same remote');
            }
            const plans = changes.map(({ name, replacement }) => {
              // Native entry metadata proves only the direct import boundary.
              // Nested containers need disposal, including when a dependency
              // was removed from the newly published graph.
              if (
                replacement.dependencies?.length ||
                dependencyGraphs.get(canonicalName(name))?.length
              )
                return {
                  mode: 'application' as const,
                  reasons: ['transitive-remote-dependencies'],
                };
              return plan(name);
            });
            selected = plans.some(item => item.mode === 'application')
              ? {
                  mode: 'application',
                  reasons: [...new Set(plans.flatMap(item => item.reasons))],
                }
              : {
                  mode: 'entries',
                  entries: [
                    ...new Set(plans.flatMap(item => item.entries || [])),
                  ].sort(),
                  reasons: [],
                };
            for (const state of states())
              if (state) {
                state.owner = token;
                state.selective = selected.mode === 'entries';
                ownedStates.add(state);
              }
            onStage('drain');
            return selected.entries;
          },
        );
      const authorized = states()
        .filter(Boolean)
        .reduce<() => Promise<number>>(
          (next, state) => () => state.context.run(token, next),
          execute,
        );
      let generation: number;
      try {
        generation = await authorized();
      } catch (error) {
        if (
          selected.mode !== 'entries' ||
          application.status?.phase !== 'unavailable'
        )
          throw error;
        // Modern keeps a failed scope closed and widens its next update to the
        // whole application. Retry once using the same intended remote targets.
        onStage('fallback');
        try {
          generation = await authorized();
        } catch (recoveryError) {
          throw new AggregateError(
            [error, recoveryError],
            'SSR update and application recovery failed',
          );
        }
      }
      for (const { name, replacement } of changes)
        if (replacement.dependencies !== undefined)
          dependencyGraphs.set(canonicalName(name), replacement.dependencies);
      return { ...selected, generation };
    } finally {
      for (const state of ownedStates)
        if (state.owner === token) {
          state.owner = undefined;
          state.selective = false;
        }
    }
  }
  type Application = Parameters<typeof performUpdate>[0];
  type Result = Awaited<ReturnType<typeof performUpdate>> & {
    revision: number;
    appliedRevision: number;
    operationId: string;
    timingsMs: Record<string, number>;
  };
  const updates = new WeakMap<
    Application,
    {
      revision: number;
      fingerprint: string;
      operationId: string;
      mutationStarted: boolean;
      stage: string;
      timingsMs: Record<string, number>;
      phase: 'scheduled' | 'pending' | 'applied' | 'failed';
      appliedRevision?: number;
      promise: Promise<Result>;
      error?: unknown;
    }
  >();
  let attempt = 0;
  function capture(changes: Change[], revision: number) {
    if (!Number.isSafeInteger(revision) || revision < 1)
      throw new TypeError('revision must be a positive safe integer');
    if (
      !changes.length ||
      changes.some(
        ({ name, replacement }) =>
          typeof name !== 'string' ||
          !name ||
          typeof replacement?.entry !== 'string' ||
          !replacement.entry,
      )
    )
      throw new TypeError(
        'Unique remote names and replacement entries are required',
      );
    const captured = changes
      .map(({ name, replacement }) => {
        const { entry, type, entryGlobalName, client, dependencies } =
          replacement;
        const publicTarget =
          options.hydration || client
            ? clientRemote({ ...client, name } as SSRClientRemote)
            : undefined;
        return {
          name,
          replacement: {
            entry,
            ...(type !== undefined ? { type } : {}),
            ...(entryGlobalName !== undefined ? { entryGlobalName } : {}),
            ...(dependencies !== undefined
              ? { dependencies: structuredClone(dependencies) }
              : {}),
            ...(publicTarget
              ? {
                  client: {
                    entry: publicTarget.entry,
                    ...(publicTarget.type ? { type: publicTarget.type } : {}),
                    ...(publicTarget.entryGlobalName
                      ? { entryGlobalName: publicTarget.entryGlobalName }
                      : {}),
                  },
                }
              : {}),
          },
        };
      })
      .sort((a, b) =>
        canonicalName(a.name).localeCompare(canonicalName(b.name)),
      );
    // Bundler graph keys retain the declared alias. Canonical identity is only
    // for revision comparison and duplicate detection, not entry-scope planning.
    const normalized = captured.map(({ name, replacement }) => ({
      name: canonicalName(name),
      replacement,
    }));
    if (new Set(normalized.map(({ name }) => name)).size !== captured.length)
      throw new TypeError(
        'Unique remote names and replacement entries are required',
      );
    return { captured, fingerprint: JSON.stringify(normalized) };
  }
  const receipt = (
    state: NonNullable<ReturnType<typeof updates.get>>,
  ): SSRUpdateReceipt => ({
    operationId: state.operationId,
    revision: state.revision,
    phase: state.phase === 'failed' ? 'scheduled' : state.phase,
  });
  function submit(
    application: Application,
    changes: Change[],
    input: SSRUpdateOptions & { defer: 'after-response' },
  ): SSRUpdateReceipt;
  function submit(
    application: Application,
    changes: Change[],
    input?: SSRUpdateOptions & { defer?: undefined },
  ): Promise<Result>;
  function submit(
    application: Application,
    changes: Change[],
    input?: SSRUpdateOptions,
  ): Promise<Result> | SSRUpdateReceipt;
  function submit(
    application: Application,
    changes: Change[],
    input?: SSRUpdateOptions,
  ): Promise<Result> | SSRUpdateReceipt {
    const previous = updates.get(application);
    const revision = input?.revision ?? (previous?.revision ?? 0) + 1;
    let captured: Change[], fingerprint: string;
    try {
      if (!input?.defer) application.assertUpdateAllowed?.();
      if (input?.defer && !application.defer)
        throw new Error(
          'Modern SSR application does not support deferred updates',
        );
      ({ captured, fingerprint } = capture(changes, revision));
      if (previous) {
        if (revision < previous.revision)
          throw new Error('Stale SSR update revision');
        if (revision === previous.revision) {
          if (fingerprint !== previous.fingerprint)
            throw new Error('SSR revision already has a different replacement');
          if (previous.phase !== 'failed')
            return input?.defer ? receipt(previous) : previous.promise;
        }
      }
    } catch (error) {
      if (input?.defer) throw error;
      return Promise.reject(error);
    }
    const state = {
      revision,
      fingerprint,
      operationId: `${revision}:${++attempt}`,
      mutationStarted: false,
      phase: (input?.defer ? 'scheduled' : 'pending') as
        'scheduled' | 'pending' | 'applied' | 'failed',
      stage: input?.defer ? 'after-response' : 'queue',
      timingsMs: {} as Record<string, number>,
      appliedRevision: previous?.appliedRevision,
      promise: undefined as unknown as Promise<Result>,
      error: undefined as unknown,
    };
    // The application queue serializes resource publication. Retain only the
    // latest message; older pending completions may advance appliedRevision.
    updates.set(application, state);
    const started = performance.now();
    let stageStarted = started;
    const onStage = (stage: string) => {
      const now = performance.now();
      state.timingsMs[state.stage] =
        (state.timingsMs[state.stage] || 0) + now - stageStarted;
      stageStarted = now;
      state.stage = stage;
    };
    const execute = () => {
      // A newer notification may have arrived while the triggering SSR streamed.
      // Never apply this older release after the newer one.
      if (
        input?.defer &&
        revision < (updates.get(application)?.revision ?? revision)
      )
        return Promise.reject(new Error('Stale SSR update revision'));
      state.phase = 'pending';
      onStage('queue');
      return performUpdate(
        application,
        captured,
        () => {
          state.mutationStarted = true;
          if (
            options.hydration ||
            captured.some(({ replacement }) => replacement.client)
          ) {
            hydrationEnabled = true;
            const normalized = canonicalClientTargets();
            clientTargets.clear();
            for (const [name, remote] of normalized)
              clientTargets.set(name, remote);
            for (const { name, replacement } of captured) {
              if (!replacement.client) continue;
              clientTargets.set(
                canonicalName(name),
                clientRemote({
                  ...replacement.client,
                  name: canonicalName(name),
                } as SSRClientRemote),
              );
            }
            targetRevision = revision;
          }
        },
        onStage,
      );
    };
    let operation: Promise<Awaited<ReturnType<typeof performUpdate>>>;
    try {
      operation = controller.runExternal(
        application,
        captured.map(({ name, replacement }) => ({
          name: canonicalName(name),
          ...replacement,
        })),
        execute,
        input?.defer
          ? scheduled => application.defer!(scheduled).completed
          : undefined,
      );
    } catch (error) {
      // Capacity rejection is not acceptance: keep an earlier accepted release
      // eligible to run, and allow this revision to be submitted again later.
      if (input?.defer) {
        if (updates.get(application) === state) {
          if (previous) updates.set(application, previous);
          else updates.delete(application);
        }
        throw error;
      }
      operation = Promise.reject(error);
    }
    state.promise = operation.then(
      result => {
        onStage('applied');
        state.timingsMs.total = performance.now() - started;
        state.phase = 'applied';
        const latest = updates.get(application)!;
        latest.appliedRevision = Math.max(
          latest.appliedRevision ?? 0,
          revision,
        );
        return {
          ...result,
          revision,
          appliedRevision: revision,
          operationId: state.operationId,
          timingsMs: { ...state.timingsMs },
        };
      },
      error => {
        const failedStage = state.stage;
        onStage('failed');
        state.timingsMs.total = performance.now() - started;
        state.phase = 'failed';
        const failure = Object.assign(
          new Error(
            error instanceof Error ? error.message : 'SSR update failed',
            { cause: error },
          ),
          {
            operationId: state.operationId,
            revision,
            appliedRevision: updates.get(application)?.appliedRevision,
            mutationStarted: state.mutationStarted,
            failedStage,
            timingsMs: { ...state.timingsMs },
            application: application.status,
          },
        );
        state.error = failure;
        throw failure;
      },
    );
    if (input?.defer) {
      // The caller owns a receipt, not a completion promise. Failure is exposed by
      // status(); handle the rejection here so a failed background update is safe.
      void state.promise.catch(() => {});
      return receipt(state);
    }
    return state.promise;
  }
  const controller = createRemoteUpdateController<
    Application,
    Awaited<ReturnType<typeof performUpdate>>
  >({
    maxPendingUpdates: options.maxPendingUpdates,
    resolve(name) {
      let registered = instances()
        .flatMap(instance => [
          ...(instance.options?.remotes || []),
          ...(registrations.get(instance)?.values() || []),
        ])
        .concat(owner.registrations || [], options.remotes || [])
        .find(remote => remote.name === name || remote.alias === name);
      if (!registered) return undefined;
      Object.assign(
        (registered = { ...registered }),
        getSSRUpdateRegistration(owner.id, registered.name),
      );
      const publicTarget = canonicalClientTargets().get(registered.name);
      if (!publicTarget) return { ...registered };
      const { name: _name, ...client } = publicTarget;
      return { ...registered, client };
    },
    baseline(target) {
      for (const instance of instances()) {
        const manifest = instance.snapshotHandler?.manifestCache?.get(
          target.entry,
        );
        if (manifest) return manifest;
      }
      return undefined;
    },
    apply(application, targets, onMutation, onStage) {
      // Native graph keys are declared aliases; preserve them for scope planning.
      const changes = targets.map(({ name, ...replacement }) => {
        let registered = instances()
          .flatMap(instance => instance.options?.remotes || [])
          .find(remote => remote.name === name);
        return { name: registered?.alias || name, replacement };
      });
      return performUpdate(
        application,
        changes,
        () => {
          onMutation();
          if (options.hydration || targets.some(target => target.client)) {
            hydrationEnabled = true;
            for (const { name, ...target } of targets) {
              if (!target.client) continue;
              clientTargets.set(
                name,
                clientRemote({ ...target.client, name } as SSRClientRemote),
              );
            }
            targetRevision++;
          }
        },
        onStage,
      );
    },
  });
  function updateRemotes(
    application: Application,
    remotes: SSRRemoteReplacement[],
    input: SSRUpdateOptions & { defer: 'after-response' },
  ): SSRUpdateReceipt;
  function updateRemotes(
    application: Application,
    remotes: SSRRemoteReplacement[],
    input?: SSRUpdateOptions & { defer?: undefined },
  ): Promise<any>;
  function updateRemotes(
    application: Application,
    remotes: SSRRemoteReplacement[],
    input?: SSRUpdateOptions,
  ): Promise<any> | SSRUpdateReceipt;
  function updateRemotes(
    application: Application,
    remotes: SSRRemoteReplacement[],
    input?: SSRUpdateOptions,
  ): Promise<any> | SSRUpdateReceipt {
    try {
      const targets = remotes.map(remote => {
        if (
          !options.hydration &&
          !remote.client &&
          !canonicalClientTargets().has(canonicalName(remote.name))
        )
          return remote;
        const client = clientRemote({
          ...remote.client,
          name: remote.name,
        } as SSRClientRemote);
        const { name: _name, ...target } = client;
        return { ...remote, client: target };
      });
      return controller.updateRemotes(application, targets, input);
    } catch (error) {
      if (input?.defer) throw error;
      return Promise.reject(error);
    }
  }
  function update(
    application: Application,
    name: string,
    replacement: Replacement,
    input: Pick<SSRUpdateOptions, 'revision'> & { defer: 'after-response' },
  ): SSRUpdateReceipt;
  function update(
    application: Application,
    name: string,
    replacement: Replacement,
    input?: Pick<SSRUpdateOptions, 'revision'> & { defer?: undefined },
  ): Promise<Result>;
  function update(
    application: Application,
    name: string,
    replacement: Replacement,
    input?: Pick<SSRUpdateOptions, 'revision' | 'defer'>,
  ): Promise<Result> | SSRUpdateReceipt {
    return submit(application, [{ name, replacement }], input);
  }
  return {
    owner,
    run: <T>(operation: () => T): T => runWithSSRUpdateOwner(owner, operation),
    bindRuntime: (instance: any) => bindSSRRuntime(owner, instance),
    plan,
    shouldUpdateRemote: controller.shouldUpdateRemote,
    shouldUpdateRemotes: controller.shouldUpdateRemotes,
    updateRemotes,
    whenIdle: controller.whenIdle,
    /** Run in Modern's unpublished resource validation hook, before publication. */
    prepareResources(resources: { templates: Record<string, string> }) {
      owner.registrations = undefined;
      if (!hydrationEnabled) return;
      const script = releaseScript(options.name, targetRevision, [
        ...canonicalClientTargets().values(),
      ]);
      resources.templates = Object.fromEntries(
        Object.entries(resources.templates).map(([key, html]) => {
          const clean = html.replace(
            /<script type="application\/json" data-modern-mf-release>[\s\S]*?<\/script>/g,
            '',
          );
          if (!/<head(?:\s[^>]*)?>/i.test(clean))
            throw new Error('SSR release bootstrap requires an HTML head');
          return [
            key,
            clean.replace(/<head(?:\s[^>]*)?>/i, head => head + script),
          ];
        }),
      );
    },
    status(application: Application) {
      const current = controller.status(application);
      if (current) return current;
      const state = updates.get(application);
      return state
        ? {
            revision: state.revision,
            appliedRevision: state.appliedRevision,
            phase: state.phase,
            error: state.error,
            operationId: state.operationId,
            mutationStarted: state.mutationStarted,
            stage: state.stage,
            timingsMs: { ...state.timingsMs },
            application: application.status,
          }
        : undefined;
    },
    /** @deprecated PoC compatibility. Use the application-bound updateRemotes API. */
    update,
    async reload(entry: string) {
      const record = owner.entries.get(entry);
      if (!record || record.reasons.length || record.rootIds.length !== 1)
        throw new Error(`Missing reloadable SSR entry: ${entry}`);
      // Re-evaluate the invalidated root in its existing runtime, retaining
      // unrelated modules and shared singleton closures.
      return await record.load();
    },
    async dispose(
      entries?: readonly string[],
      { preserveRemotes = true } = {},
    ) {
      // Partial updates reuse runtimes. Full rebuilds release their registrations.
      if (entries) return;
      const owned = records();
      const runtimes = new Set(owned.map(record => record.runtime));
      for (const instance of instances())
        for (const runtime of instance[
          Symbol.for('module-federation.clear-cache.adapters')
        ]?.bindings || [])
          runtimes.add(runtime);
      const hosts = instances();
      // Carry only declarative registrations across generations, never factories
      // or plugins from the old application bundle.
      if (!preserveRemotes) {
        owner.registrations = undefined;
        clearSSRUpdateCandidates(owner.id);
      }
      if (preserveRemotes && hosts.length)
        owner.registrations = hosts[0].options.remotes.map((remote: any) => ({
          ...remote,
        }));
      const providers = new Set<any>([
        ...retiringProviders,
        ...hosts.flatMap(host => [...(host.retainedProviders || [])]),
      ]);
      const globalInstances: any[] =
        (globalThis as any).__FEDERATION__?.__INSTANCES__ || [];
      const knownInstances = [...new Set([...globalInstances, ...providers])];
      // Follow actual containers through the entire retiring graph. A direct
      // provider can keep a nested provider alive even after our host detaches it.
      const pendingProviders = [...hosts, ...providers];
      const visitedProviders = new Set<any>();
      for (const host of pendingProviders) {
        if (visitedProviders.has(host)) continue;
        visitedProviders.add(host);
        for (const module of host.moduleCache?.values() || []) {
          const info = module.remoteInfo;
          const provider = helpers.global.getRemoteFederationInstance(
            info,
            knownInstances,
            module.remoteEntryExports || module.lib,
          );
          if (
            provider &&
            !providers.has(provider) &&
            !hosts.includes(provider)
          ) {
            providers.add(provider);
            pendingProviders.push(provider);
          }
        }
        for (const provider of host.retainedProviders || [])
          if (!providers.has(provider) && !hosts.includes(provider)) {
            providers.add(provider);
            pendingProviders.push(provider);
          }
      }
      const sharedRecords = (scope: any) =>
        Object.values(scope || {}).flatMap((packages: any) =>
          Object.values(packages).flatMap((versions: any) =>
            Object.values(versions),
          ),
        );
      const scopes = (globalThis as any).__FEDERATION__?.__SHARE__ || {};
      // A retained provider can itself consume another retiring provider. Once it
      // survives this update, propagate its ownership through that dependency
      // graph until no additional runtime needs to survive.
      let retained = true;
      while (retained) {
        retained = false;
        const ownedInstances = new Set([...hosts, ...providers]);
        const names = new Set(
          [...ownedInstances].map(instance => instance.name),
        );
        const otherInstances = knownInstances.filter(
          other => !ownedInstances.has(other),
        );
        for (const provider of providers) {
          const providerShared = new Set([
            ...sharedRecords(provider.shareScopeMap),
            ...sharedRecords(scopes[provider.options.id]),
          ]);
          const externallyUsed = [...providerShared].some(
            (shared: any) =>
              shared.from === provider.name &&
              ((shared.loading && !shared.loaded) ||
                shared.useIn?.some((name: string) => {
                  const consumers = otherInstances.filter(
                    other => other.name === name,
                  );
                  return consumers.length
                    ? consumers.some(other =>
                        sharedRecords(other.shareScopeMap).includes(shared),
                      )
                    : !names.has(name);
                })),
          );
          const externallyLoaded = otherInstances.some(other =>
            [...(other.moduleCache?.values() || [])].some(
              (module: any) =>
                helpers.global.getRemoteFederationInstance(
                  module.remoteInfo,
                  knownInstances,
                  module.remoteEntryExports || module.lib,
                ) === provider,
            ),
          );
          if (externallyUsed || externallyLoaded) {
            providers.delete(provider);
            retained = true;
          }
        }
      }
      for (const host of [...hosts, ...providers]) {
        const state = host[Symbol.for('modern-js.mf.ssr.consumption')];
        if (state) state.disposingInstances = new Set([...hosts, ...providers]);
      }
      // Close the entire owned generation before releasing shared ownership.
      const disposed = await Promise.allSettled(
        [...new Set([...hosts, ...providers])].map(host => host.destroy()),
      );
      const failures = disposed.filter(result => result.status === 'rejected');
      if (failures.length)
        throw new AggregateError(
          failures.map(result => result.reason),
          'SSR instance disposal failed',
        );
      for (const runtime of runtimes) runtime.federation?.disposeClearCache?.();
      for (const record of owned) owner.entries.delete(record.entry);
      for (const host of hosts) owner.instances.delete(host);
      retiringProviders.clear();
      if (!preserveRemotes) releaseSSRUpdateOwner(owner);
    },
  };
}

export { createSSRUpdateServerPlugin } from './ssrUpdateServer';
