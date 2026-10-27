import type { ModuleFederationRuntimePlugin } from '@module-federation/enhanced/runtime';
import type { RemoteInfo } from './inspect-boundary';

export default function inspectPlugin(): ModuleFederationRuntimePlugin {
  return {
    name: 'mf-lab-inspect',
    apply(instance) {
      let createComponent: typeof import('./inspect-boundary').inspectedComponent;
      const cache = new WeakMap<object, Map<string, object>>();
      function wrap(module: unknown, info: RemoteInfo) {
        if (
          !module ||
          (typeof module !== 'object' && typeof module !== 'function')
        )
          return module;
        const original = module as {
          default?: import('react').ComponentType<Record<string, unknown>>;
        };
        if (
          typeof original.default !== 'function' &&
          !(original.default && '$$typeof' in original.default)
        )
          return module;
        const key = `${info.name}:${info.expose}:${info.manifest}:${info.entry}`;
        let variants = cache.get(module);
        if (!variants) {
          variants = new Map();
          cache.set(module, variants);
        }
        if (variants.has(key)) return variants.get(key);
        const Component = original.default!;
        const Inspected = createComponent(Component, info);
        // Preserve non-enumerable MF module IDs and named/data-loader exports.
        const descriptors = Object.getOwnPropertyDescriptors(module);
        descriptors.default = {
          value: Inspected,
          enumerable: true,
          configurable: true,
        };
        const decorated = Object.defineProperties({}, descriptors);
        variants.set(key, decorated);
        return decorated;
      }
      return {
        async onLoad(args) {
          if (/\.data(?:\.client)?$/.test(args.expose)) return;
          const snapshot = instance.snapshotHandler.getGlobalRemoteInfo(
            args.options.remoteInfo,
          ).remoteSnapshot;
          if (
            snapshot &&
            'modules' in snapshot &&
            snapshot.modules.some(
              module =>
                module.modulePath === args.expose && module.render === 'bridge',
            )
          )
            return;
          // Runtime plugins initialize before React's share scope. Load the UI
          // only after a remote is ready, never from the runtime bootstrap.
          createComponent = (await import('./inspect-boundary'))
            .inspectedComponent;
          const remote = args.options.remoteInfo;
          const info: RemoteInfo = {
            name: remote.entryGlobalName || remote.name,
            expose: args.expose,
            manifest: 'entry' in args.remote ? args.remote.entry : remote.entry,
            entry: remote.entry,
            consumer: instance.name,
            request: args.id,
          };
          if (args.exposeModuleFactory) {
            return () => {
              const module = args.exposeModuleFactory();
              return module instanceof Promise
                ? module.then(value => wrap(value, info))
                : wrap(module, info);
            };
          }
          const decorated = wrap(args.exposeModule, info);
          if (decorated === args.exposeModule) return;
          // onLoad accepts function overrides. A callable namespace retains
          // the normal .default / symbol contract for runtime loadRemote calls.
          return Object.defineProperties(
            () => decorated,
            Object.getOwnPropertyDescriptors(decorated),
          );
        },
      };
    },
  };
}
