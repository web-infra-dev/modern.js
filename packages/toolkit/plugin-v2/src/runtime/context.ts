import type { PluginHook } from '../types/hooks';
import type { InternalContext, RuntimeContext } from '../types/runtime/context';
import type {
  RuntimePlugin,
  RuntimePluginExtends,
} from '../types/runtime/plugin';
import { initHooks } from './hooks';

export interface RuntimeConfig<Extends extends RuntimePluginExtends> {
  plugins?: RuntimePlugin<Extends>[];
}

export function initRuntimeContext<
  Extends extends RuntimePluginExtends,
>(params: { plugins: RuntimePlugin<Extends>[] }): RuntimeContext<Extends> {
  return {
    plugins: params.plugins,
  };
}

export function createRuntimeContext<Extends extends RuntimePluginExtends>({
  runtimeContext,
  config,
}: {
  runtimeContext: RuntimeContext<Extends>;
  config: Extends['config'];
}): InternalContext<Extends> {
  const { plugins } = runtimeContext;
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
      ...initHooks<Extends['config'], RuntimeContext<Extends>>(),
      ...extendsHooks,
    },
    extendsHooks,
    config,
  };
}
