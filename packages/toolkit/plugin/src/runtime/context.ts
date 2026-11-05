import type { PluginHook } from '../types/hooks';
import type {
  InternalRuntimeContext,
  RuntimeContext,
} from '../types/runtime/context';
import type {
  RuntimePlugin,
  RuntimePluginExtends,
} from '../types/runtime/plugin';
import { initHooks } from './hooks';
import { cloneHook } from '../hooks';

export interface RuntimeConfig<Extends extends RuntimePluginExtends> {
  plugins?: RuntimePlugin<Extends>[];
}

export function initRuntimeContext(): RuntimeContext {
  return {};
}

export function createRuntimeContext<Extends extends RuntimePluginExtends>({
  runtimeContext,
  config,
  plugins,
}: {
  runtimeContext: RuntimeContext & Extends['extendContext'];
  config: Extends['config'];
  plugins: RuntimePlugin<Extends>[];
}): InternalRuntimeContext<Extends> {
  const extendsHooks: Record<string, PluginHook<(...args: any[]) => any>> = {};
  plugins.forEach(plugin => {
    const factory = typeof plugin.registryHooks === 'function';
    const registryHooks =
      typeof plugin.registryHooks === 'function'
        ? plugin.registryHooks()
        : plugin.registryHooks || {};
    Object.keys(registryHooks).forEach(hookName => {
      extendsHooks[hookName] = factory
        ? registryHooks[hookName]
        : cloneHook(registryHooks[hookName]);
    });
  });
  let disposed = false;
  const cleanups: Array<() => void> = [];
  const context: InternalRuntimeContext<Extends> = {
    runtimeContext,
    ready: Promise.resolve(),
    get disposed() {
      return disposed;
    },
    onDispose(callback) {
      if (disposed) callback();
      else cleanups.push(callback);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      const errors: unknown[] = [];
      while (cleanups.length) {
        try {
          cleanups.pop()!();
        } catch (error) {
          errors.push(error);
        }
      }
      if (errors.length) {
        throw new AggregateError(errors, 'Runtime cleanup failed');
      }
    },
    hooks: {
      ...initHooks<
        Extends['config'],
        RuntimeContext & Extends['extendContext']
      >(() => !disposed, runtimeContext),
      ...extendsHooks,
    },
    extendsHooks,
    config,
  };
  Object.defineProperty(runtimeContext, '_internalContext', {
    value: context,
    writable: true,
    configurable: true,
  });
  return context;
}
