import { AsyncLocalStorage } from 'node:async_hooks';
import {
  helpers,
  type ModuleFederation,
  type ModuleFederationRuntimePlugin,
} from '@module-federation/enhanced/runtime';
import {
  createSSRUpdateSnapshotPlugin,
  getSSRUpdateRegistration,
} from '../../server/ssrUpdateCandidates';
import {
  bindSSRRuntime,
  ownerOfSSRRuntime,
  runtimeOwnerKey,
} from '../../server/ssrUpdateOwner';

declare const MODERN_SSR_FEDERATION_REQUIRE: any;

export const ownershipKey = Symbol.for('modern-js.mf.ssr.consumption');
export default function ssrOwnership(): ModuleFederationRuntimePlugin {
  const candidates = createSSRUpdateSnapshotPlugin();
  const entries = new Map<string, { info: any; exports: any; loading: any }>();
  let sharedProviders: ModuleFederation[] = [];
  return {
    name: 'modern-ssr-consumption-owner',
    loadSnapshot: candidates.loadSnapshot,
    loadRemoteSnapshot: candidates.loadRemoteSnapshot,
    beforeInit(args) {
      const owner = ownerOfSSRRuntime(
        typeof MODERN_SSR_FEDERATION_REQUIRE === 'undefined'
          ? undefined
          : MODERN_SSR_FEDERATION_REQUIRE,
      );
      if (owner) bindSSRRuntime(owner, args.origin);
      const remotes = (args.origin as any)[runtimeOwnerKey]?.registrations;
      if (remotes)
        args.userOptions.remotes = remotes.map((remote: any) => ({
          ...remote,
        }));
      const selected = candidates.beforeInit!(args)!;
      const ownerId = (args.origin as any)[runtimeOwnerKey]?.id;
      sharedProviders = [];
      for (const remote of selected.userOptions.remotes ??
        selected.options.remotes) {
        const candidate = ownerId
          ? getSSRUpdateRegistration(ownerId, remote.name)
          : undefined;
        const snapshot =
          candidate?.moduleInfo ||
          helpers.global.getGlobalSnapshotInfoByModuleInfo(remote);
        if (
          !snapshot ||
          !('buildVersion' in snapshot) ||
          typeof snapshot.buildVersion !== 'string' ||
          !snapshot.buildVersion
        )
          continue;
        const provider = helpers.global.getRemoteFederationInstance({
          name: remote.name,
          providerName:
            typeof snapshot.providerName === 'string'
              ? snapshot.providerName
              : undefined,
          entryGlobalName:
            'globalName' in snapshot && typeof snapshot.globalName === 'string'
              ? snapshot.globalName
              : '',
          buildVersion: snapshot.buildVersion,
          version:
            typeof snapshot.version === 'string' ? snapshot.version : undefined,
        });
        if (provider && !provider.disposed) sharedProviders.push(provider);
      }
      return selected;
    },
    beforeRegisterShare(args) {
      const { origin, pkgName, shared } = args;
      if (!shared.shareConfig.singleton) return args;
      // A retained container's factories already close over its loaded
      // singletons. Adopt those exact-version records before the new host
      // evaluates its renderer, while retaining normal MF version selection.
      for (const scope of shared.scope) {
        const records = sharedProviders
          .map(
            provider =>
              provider.shareScopeMap[scope]?.[pkgName]?.[shared.version],
          )
          .filter(record => record?.loaded && typeof record.lib === 'function');
        const record = records[0];
        if (!record) continue;
        const versions = ((origin.shareScopeMap[scope] ||= {})[pkgName] ||= {});
        const current = versions[shared.version];
        if (
          records.some(value => value.lib !== record.lib) ||
          (current?.loaded && current.lib !== record.lib)
        )
          throw new Error(
            `Selected federation providers use different loaded singletons for ${pkgName}@${shared.version}`,
          );
        versions[shared.version] = record;
      }
      return args;
    },
    afterLoadEntry({ remoteInfo, remoteEntryExports }) {
      if (!remoteEntryExports) return;
      const key = helpers.utils.getRemoteEntryUniqueKey(remoteInfo);
      entries.set(key, {
        info: remoteInfo,
        exports: remoteEntryExports,
        loading: (globalThis as any).__GLOBAL_LOADING_REMOTE_ENTRY__?.[key],
      });
    },
    removeRemote({ remote }) {
      // Runtime removal owns container/shared cleanup. This bookkeeping must not
      // retain an entry after the runtime releases it, including old URL versions.
      for (const [key, entry] of entries)
        if (entry.info.name === remote.name) entries.delete(key);
    },
    dispose({ origin }) {
      const ownedInstances: Set<any> =
        (origin as any)[ownershipKey]?.disposingInstances || new Set([origin]);
      const owners = new Set(
        [...ownedInstances].map(instance => instance.name),
      );
      const otherInstances = (
        (globalThis as any).__FEDERATION__?.__INSTANCES__ || []
      ).filter((instance: any) => !ownedInstances.has(instance));
      for (const [key, entry] of entries) {
        const providers = [
          entry.info.name,
          entry.info.providerName,
          entry.info.entryGlobalName,
        ];
        const externallyUsed = Object.values(
          (globalThis as any).__FEDERATION__?.__SHARE__ || {},
        ).some((scopes: any) =>
          Object.values(scopes).some((packages: any) =>
            Object.values(packages).some((versions: any) =>
              Object.values(versions).some(
                (shared: any) =>
                  providers.includes(shared.from) &&
                  shared.useIn?.some(
                    (name: string) =>
                      !owners.has(name) ||
                      otherInstances.some(
                        (instance: any) => instance.name === name,
                      ),
                  ),
              ),
            ),
          ),
        );
        const externallyLoaded = otherInstances.some((instance: any) =>
          [...instance.moduleCache.values()].some(
            (module: any) => module.remoteEntryExports === entry.exports,
          ),
        );
        if (externallyUsed || externallyLoaded) continue;
        entry.exports.__webpack_clear_cache__?.();
        const loading = (globalThis as any).__GLOBAL_LOADING_REMOTE_ENTRY__;
        if (loading && loading[key] === entry.loading) delete loading[key];
        const globalName = entry.info.entryGlobalName;
        if (globalName && (globalThis as any)[globalName] === entry.exports) {
          if (
            Object.getOwnPropertyDescriptor(globalThis, globalName)
              ?.configurable
          )
            delete (globalThis as any)[globalName];
          else (globalThis as any)[globalName] = undefined;
        }
      }
      entries.clear();
      sharedProviders = [];
      (origin as any)[ownershipKey]?.context.disable();
      const owner = (origin as any)[runtimeOwnerKey];
      for (const [key, record] of owner?.entries || [])
        if (record.runtime.federation?.instance === origin)
          owner.entries.delete(key);
      owner?.instances.delete(origin);
    },
    apply(instance) {
      const host = instance as any;
      if (host[ownershipKey]) return;
      const state = {
        context: new AsyncLocalStorage<object>(),
        dynamic: false,
        selective: false,
        owner: undefined as object | undefined,
      };
      Object.defineProperty(host, ownershipKey, { value: state });
      const load = instance.loadRemote;
      host.loadRemote = function (id: string, options?: { from?: string }) {
        if (options?.from !== 'build') {
          state.dynamic = true;
          if (state.selective)
            return Promise.reject(
              new Error(
                'Dynamic MF consumption violates an active static SSR update; use application rebuild mode',
              ),
            );
        }
        return load.call(this, id, options as any);
      };
      const register = instance.registerRemotes;
      host.registerRemotes = function (...args: Parameters<typeof register>) {
        if (!state.owner || state.context.getStore() !== state.owner) {
          state.dynamic = true;
          if (state.owner)
            throw new Error(
              'Remote registration outside the active SSR update owner',
            );
        }
        return register.apply(this, args);
      };
      const update = instance.updateRemotes;
      host.updateRemotes = function (...args: Parameters<typeof update>) {
        if (!state.owner || state.context.getStore() !== state.owner) {
          state.dynamic = true;
          if (state.owner)
            return Promise.reject(
              new Error('Remote update outside the active SSR update owner'),
            );
        }
        return update.apply(this, args);
      };
      const remove = instance.removeRemote;
      host.removeRemote = function (...args: Parameters<typeof remove>) {
        if (!state.owner || state.context.getStore() !== state.owner) {
          state.dynamic = true;
          if (state.owner)
            return Promise.reject(
              new Error('Remote removal outside the active SSR update owner'),
            );
        }
        return remove.apply(this, args);
      };
    },
  };
}
