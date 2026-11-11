import {
  generateSnapshotFromManifest,
  isManifestProvider,
  type Manifest,
  type ModuleInfo,
} from '@module-federation/sdk';
import type { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime';
import type { RemoteUpdateTarget } from './remoteUpdate';

type Candidate = {
  entry: string;
  type?: string;
  entryGlobalName?: string;
  snapshot?: ModuleInfo;
};
const key = Symbol.for('modern-js.mf.ssr.update-candidates');
function registry(): Map<string, Map<string, Candidate>> {
  return ((globalThis as any)[key] ||= new Map());
}

/** Install captured evidence after draining, before rebuilding any consumers. */
export function setSSRUpdateCandidates(
  application: string,
  targets: readonly Pick<
    RemoteUpdateTarget,
    'name' | 'entry' | 'type' | 'entryGlobalName' | 'moduleInfo'
  >[],
) {
  const next = new Map(registry().get(application));
  for (const target of targets) {
    const registration: Candidate = {
      ...next.get(target.name),
      entry: target.entry,
      ...(target.type === undefined ? {} : { type: target.type }),
      ...(target.entryGlobalName === undefined
        ? {}
        : { entryGlobalName: target.entryGlobalName }),
    };
    // A legacy/direct-entry update replaces the registration too, but no longer
    // pins a previously captured manifest at that new target.
    delete registration.snapshot;
    if (!target.moduleInfo) {
      next.set(target.name, registration);
      continue;
    }
    const info = structuredClone(target.moduleInfo);
    const snapshot = info.metaData
      ? generateSnapshotFromManifest(info as unknown as Manifest, {
          version: target.entry,
        })
      : (info as unknown as ModuleInfo);
    if (
      !('remoteEntry' in snapshot) ||
      typeof snapshot.remoteEntry !== 'string' ||
      !snapshot.remoteEntry ||
      isManifestProvider(snapshot)
    )
      throw new TypeError('SSR update requires a resolved provider Snapshot.');
    next.set(target.name, { ...registration, snapshot });
  }
  // Invalid evidence must not partially replace an application's candidates.
  registry().set(application, next);
}

/** Service-lifetime cleanup. An ordinary application rebuild keeps candidates. */
export function clearSSRUpdateCandidates(application: string) {
  registry().delete(application);
}

/** Restore the selected registration when a service creates a new runtime. */
export function getSSRUpdateRegistration(
  application: string,
  name: string,
): RemoteUpdateTarget | undefined {
  const candidate = registry().get(application)?.get(name);
  if (!candidate) return;
  const { snapshot, ...registration } = structuredClone(candidate);
  return {
    name,
    ...registration,
    ...(snapshot
      ? { moduleInfo: snapshot as unknown as Record<string, unknown> }
      : {}),
  };
}

/**
 * Keep candidate snapshots local to an application, including its ingress.
 * User afterResolve hooks must retain this selected deployment identity. Hooks
 * that adjust request headers or other non-identity policy remain supported.
 */
export function createSSRUpdateSnapshotPlugin(
  application?: string,
): ModuleFederationRuntimePlugin {
  const select = (args: {
    options: { name: string };
    moduleInfo: { name: string; entry?: string };
  }) => {
    const candidate = registry()
      .get(application ?? args.options.name)
      ?.get(args.moduleInfo.name);
    if (!candidate?.snapshot || candidate.entry !== args.moduleInfo.entry)
      return;
    // Runtime/plugin bookkeeping cannot mutate the retained release evidence.
    return structuredClone(candidate.snapshot);
  };
  return {
    name: 'modern-ssr-update-candidates',
    beforeInit(args) {
      const candidates = registry().get(application ?? args.origin.name);
      if (candidates && args.userOptions.remotes) {
        args.userOptions.remotes = args.userOptions.remotes.map(remote => {
          const candidate = candidates.get(remote.name);
          if (!candidate) return remote;
          return {
            ...remote,
            entry: candidate.entry,
            ...(candidate.type === undefined ? {} : { type: candidate.type }),
            ...(candidate.entryGlobalName === undefined
              ? {}
              : { entryGlobalName: candidate.entryGlobalName }),
          } as typeof remote;
        });
      }
      return args;
    },
    loadSnapshot(args) {
      const snapshot = select(args);
      return snapshot ? { ...args, remoteSnapshot: snapshot } : args;
    },
    loadRemoteSnapshot(args) {
      const snapshot = select(args);
      return snapshot ? { ...args, remoteSnapshot: snapshot } : args;
    },
  };
}
