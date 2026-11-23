import type { ProviderModuleInfo } from '@module-federation/sdk';
import { resolveTargetModuleInfo } from '@module-federation/node/lifecycle';
import type { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime';
import type { RemoteUpdateTarget } from './remoteUpdate';
import { runtimeOwnerKey } from './ssrUpdateOwner';

type Candidate = {
  entry: string;
  type?: string;
  entryGlobalName?: string;
  snapshot?: ProviderModuleInfo;
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
    'name' | 'entry' | 'type' | 'entryGlobalName' | 'manifest' | 'moduleInfo'
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
    const snapshot = resolveTargetModuleInfo({
      entry: target.entry,
      manifest: target.manifest,
      moduleInfo: target.moduleInfo,
    });
    if (!snapshot) {
      next.set(target.name, registration);
      continue;
    }
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
    ...(snapshot ? { moduleInfo: snapshot } : {}),
  };
}

/**
 * Keep candidate snapshots local to an application, including its ingress.
 * User afterResolve hooks must retain this selected deployment identity. Hooks
 * that adjust request headers or other non-identity policy remain supported.
 */
export function createSSRUpdateSnapshotPlugin(
  application?: string | (() => string | undefined),
): ModuleFederationRuntimePlugin {
  let ownerId: string | undefined;
  const explicitOwner = () =>
    typeof application === 'function' ? application() : application;
  const select = (args: {
    options: { name: string };
    moduleInfo: { name: string; entry?: string };
  }) => {
    const candidate = registry()
      .get(explicitOwner() ?? ownerId ?? '')
      ?.get(args.moduleInfo.name);
    if (!candidate?.snapshot || candidate.entry !== args.moduleInfo.entry)
      return;
    // Runtime/plugin bookkeeping cannot mutate the retained release evidence.
    return structuredClone(candidate.snapshot);
  };
  return {
    name: 'modern-ssr-update-candidates',
    beforeInit(args) {
      const owner = (args.origin as any)[runtimeOwnerKey];
      if (owner) ownerId = owner.id;
      const candidates = registry().get(explicitOwner() ?? ownerId ?? '');
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
    beforeRegisterRemote(args) {
      // A rebuilt provider can register a dependency while evaluating its
      // expose, after beforeInit has run. Its first registration must use the
      // owner's selected release. Later explicit overrides keep their meaning.
      if (
        args.origin.options.remotes.some(
          remote => remote.name === args.remote.name,
        )
      )
        return args;
      const owner = (args.origin as any)[runtimeOwnerKey];
      const candidate = registry()
        .get(explicitOwner() ?? owner?.id ?? ownerId ?? '')
        ?.get(args.remote.name);
      if (candidate)
        Object.assign(args.remote, {
          entry: candidate.entry,
          ...(candidate.type === undefined ? {} : { type: candidate.type }),
          ...(candidate.entryGlobalName === undefined
            ? {}
            : { entryGlobalName: candidate.entryGlobalName }),
        });
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
