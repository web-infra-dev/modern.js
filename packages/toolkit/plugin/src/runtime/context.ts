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
    const { registryHooks = {} } = plugin;
    Object.keys(registryHooks).forEach(hookName => {
      extendsHooks[hookName] = registryHooks[hookName];
    });
  });
  return {
    ...runtimeContext,
    hooks: {
      ...initHooks<
        Extends['config'],
        RuntimeContext & Extends['extendContext']
      >(),
      ...extendsHooks,
    },
    extendsHooks,
    config,
  };
}
