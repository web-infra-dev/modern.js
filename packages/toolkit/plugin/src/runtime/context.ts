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

const ready = Promise.resolve();

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
  let cleanups: Array<() => void> | undefined;
  const context: Omit<InternalRuntimeContext<Extends>, 'disposed'> & {
    disposed: boolean;
  } = {
    runtimeContext,
    ready,
    disposed: false,
    onDispose(callback) {
      if (context.disposed) callback();
      else (cleanups ||= []).push(callback);
    },
    dispose() {
      if (context.disposed) return;
      context.disposed = true;
      let errors: unknown[] | undefined;
      while (cleanups?.length) {
        try {
          cleanups.pop()!();
        } catch (error) {
          (errors ||= []).push(error);
        }
      }
      cleanups = undefined;
      if (errors) {
        throw new AggregateError(errors, 'Runtime cleanup failed');
      }
    },
    hooks: {
      ...initHooks<
        Extends['config'],
        RuntimeContext & Extends['extendContext']
      >(() => !context.disposed, runtimeContext),
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
