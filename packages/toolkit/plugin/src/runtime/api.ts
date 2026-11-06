import type { PluginHook } from '../types';
import { merge } from '@modern-js/runtime-utils/merge';
import type { PluginManager } from '../types/plugin';
import type { RuntimePluginAPI } from '../types/runtime/api';
import type {
  InternalRuntimeContext,
  RuntimeContext,
} from '../types/runtime/context';
import type {
  RuntimePlugin,
  RuntimePluginExtends,
} from '../types/runtime/plugin';
import type { DeepPartial } from '../types/utils';

export function initPluginAPI<Extends extends RuntimePluginExtends>({
  context,
  plugins,
}: {
  context: InternalRuntimeContext<Extends>;
  pluginManager: PluginManager;
  plugins: RuntimePlugin<Extends>[];
}): RuntimePluginAPI<Extends> {
  const { hooks, extendsHooks } = context;

  function getRuntimeContext() {
    return context.runtimeContext;
  }

  function updateRuntimeContext(
    updateContext: DeepPartial<RuntimeContext & Extends['extendContext']>,
  ) {
    merge(context.runtimeContext, updateContext);
  }

  function getHooks() {
    return {
      ...hooks,
    };
  }

  function getRuntimeConfig() {
    if (context.config) {
      return context.config;
    }
    throw new Error('Cannot access config');
  }

  const pluginAPI: Record<string, any> = {
    updateRuntimeContext,
    getRuntimeContext,
    onDispose: context.onDispose,
    getHooks,
    getRuntimeConfig,
  };
  for (const name of [
    'config',
    'onBeforeRender',
    'wrapRoot',
    'pickContext',
    'extendStringSSRCollectors',
    'extendStreamSSR',
  ] as const) {
    pluginAPI[name] = hooks[name].tap;
  }
  for (const plugin of plugins) {
    if (plugin._registryApi)
      Object.assign(
        pluginAPI,
        plugin._registryApi(getRuntimeContext, updateRuntimeContext),
      );
  }
  if (extendsHooks) {
    for (const name of Object.keys(extendsHooks)) {
      pluginAPI[name] = (
        extendsHooks as Record<string, PluginHook<(...args: any[]) => any>>
      )[name].tap;
    }
  }

  if (typeof Proxy === 'undefined') {
    return pluginAPI as RuntimePluginAPI<Extends>;
  }

  return new Proxy(pluginAPI, {
    get(target: Record<string, any>, prop: string) {
      // hack then function to fix p-defer handle error
      if (prop === 'then') {
        return undefined;
      }
      if (prop in target) {
        return target[prop];
      }
      return () => {
        console.warn(`api.${prop.toString()} not exist`);
      };
    },
  }) as RuntimePluginAPI<Extends>;
}
