import { AsyncLocalStorage } from 'node:async_hooks';
import type { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime';

export const ownershipKey = Symbol.for('modern-js.mf.ssr.consumption');
export default function ssrOwnership(): ModuleFederationRuntimePlugin {
  const entries = new Map<string, { info: any; exports: any; loading: any }>();
  return {
    name: 'modern-ssr-consumption-owner',
    beforeInit(args) {
      const remotes = (globalThis as any)[
        Symbol.for('modern-js.mf.ssr.registrations')
      ]?.get(args.origin.name);
      if (remotes)
        args.userOptions.remotes = remotes.map((remote: any) => ({
          ...remote,
        }));
      return args;
    },
    afterLoadEntry({ remoteInfo, remoteEntryExports }) {
      if (!remoteEntryExports) return;
      const key = remoteInfo.name + ':' + remoteInfo.entry;
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
      const owners =
        (origin as any)[ownershipKey]?.disposingNames || new Set([origin.name]);
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
                  shared.useIn?.some((name: string) => !owners.has(name)),
              ),
            ),
          ),
        );
        const externallyLoaded = (
          (globalThis as any).__FEDERATION__?.__INSTANCES__ || []
        ).some(
          (instance: any) =>
            !owners.has(instance.name) &&
            !instance.disposed &&
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
      (origin as any)[ownershipKey]?.context.disable();
      const registry = (globalThis as any)[
        Symbol.for('modern-js.mf.ssr.entries')
      ];
      for (const [key, record] of registry || [])
        if (record.runtime.federation?.instance === origin)
          registry.delete(key);
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
