import { helpers } from '@module-federation/enhanced/runtime';
import type { ModuleFederation } from '@module-federation/enhanced/runtime';
import type { ModuleInfo } from '@module-federation/sdk';

const snapshotKey = Symbol.for('modern-js.mf.ssr.selected-snapshot');
/** Keep resolution evidence with its Module, including custom snapshot hooks.
 * Removing the Module releases it without a second cache or eviction policy. */
export function recordSSRRemoteSnapshot(
  consumer: ModuleFederation,
  name: string,
  snapshot: ModuleInfo,
) {
  const module = consumer.moduleCache.get(name);
  if (module) (module as any)[snapshotKey] = snapshot;
}

export function getSSRRemoteSnapshot(
  consumer: ModuleFederation,
  name: string,
): ModuleInfo | undefined {
  const module = consumer.moduleCache.get(name);
  return (
    module &&
    ((module as any)[snapshotKey] ||
      helpers.global.getGlobalSnapshotInfoByModuleInfo(module.remoteInfo))
  );
}

type SSRRuntime = ModuleFederation & {
  retainedProviders?: Set<ModuleFederation>;
};

/** Read the live graph rather than retaining a second set of container references. */
export function collectSSRRuntimeGraph(
  roots: Iterable<ModuleFederation>,
  { includeRetained = false } = {},
): Set<ModuleFederation> {
  const pending = [...roots];
  const known = new Set<ModuleFederation>([
    ...(globalThis.__FEDERATION__?.__INSTANCES__ || []),
    ...pending,
  ]);
  // Retired containers can have left the global registry while another runtime
  // still owns them. Include them for lookup without treating them as active.
  const retained = [...known];
  for (const instance of retained)
    for (const provider of (instance as SSRRuntime).retainedProviders || [])
      if (!known.has(provider)) {
        known.add(provider);
        retained.push(provider);
      }
  const instances = new Set<ModuleFederation>();
  for (const instance of pending) {
    if (instances.has(instance)) continue;
    instances.add(instance);
    for (const module of instance.moduleCache?.values() || []) {
      const provider = helpers.global.getRemoteFederationInstance(
        module.remoteInfo,
        [...known],
      );
      if (provider && !instances.has(provider)) pending.push(provider);
    }
    if (includeRetained)
      for (const provider of (instance as SSRRuntime).retainedProviders || [])
        if (!instances.has(provider)) pending.push(provider);
  }
  return instances;
}

/** A registration is scoped to its consuming runtime, not globally to its name. */
export function collectSSRRemoteRegistrations(
  roots: Iterable<ModuleFederation>,
) {
  return [...collectSSRRuntimeGraph(roots)].flatMap(consumer =>
    consumer.options.remotes.map(remote => ({
      consumer,
      remote: { ...remote },
    })),
  );
}

/** Retiring a Service scope must leave other scopes' live containers intact. */
export function isSSRRuntimeReferenced(
  provider: ModuleFederation,
  retiring: ReadonlySet<ModuleFederation>,
) {
  const peers = (globalThis.__FEDERATION__?.__INSTANCES__ || []).filter(
    instance => !retiring.has(instance),
  );
  if (
    peers.some(
      peer =>
        (peer as SSRRuntime).retainedProviders?.has(provider) ||
        [...peer.moduleCache.values()].some(
          module =>
            helpers.global.getRemoteFederationInstance(module.remoteInfo, [
              provider,
            ]) === provider,
        ),
    )
  )
    return true;
  const records = (instance: ModuleFederation) =>
    Object.values(instance.shareScopeMap || {}).flatMap(packages =>
      Object.values(packages).flatMap(versions => Object.values(versions)),
    );
  const owned = new Set(
    records(provider).filter(
      record =>
        record.from === provider.name && (record.loaded || record.loading),
    ),
  );
  return peers.some(peer =>
    records(peer).some(
      record => owned.has(record) && record.useIn?.includes(peer.name),
    ),
  );
}
