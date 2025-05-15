import { merge } from '@modern-js/runtime-utils/merge';
import type { PluginHook } from '../types';
import type { PluginManager } from '../types/plugin';
import type {
  AllKeysForRuntimePluginExtendsAPI,
  AllValueForRuntimePluginExtendsAPI,
  RuntimePluginAPI,
  RuntimePluginExtendsAPI,
} from '../types/runtime/api';
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
    if (context) {
      const { hooks, extendsHooks, config, pluginAPI, ...runtimeContext } =
        context;
      runtimeContext._internalContext = context;
      return runtimeContext as RuntimeContext & Extends['extendContext'];
    }
    throw new Error('Cannot access context');
  }

  function updateRuntimeContext(
    updateContext: DeepPartial<RuntimeContext & Extends['extendContext']>,
  ) {
    context = merge(context, updateContext);
  }

  function getHooks() {
    return {
      ...hooks,
      ...extendsHooks,
    };
  }

  function getRuntimeConfig() {
    if (context.config) {
      return context.config;
    }
    throw new Error('Cannot access config');
  }

  const extendsPluginApi: Partial<RuntimePluginExtendsAPI<Extends>> = {};

  plugins.forEach(plugin => {
    const { _registryApi } = plugin;
    if (_registryApi) {
      const apis = _registryApi(getRuntimeContext, updateRuntimeContext);
      Object.keys(apis).forEach(apiName => {
        extendsPluginApi[apiName as keyof RuntimePluginExtendsAPI<Extends>] =
          apis[
            apiName
          ] as RuntimePluginExtendsAPI<Extends>[keyof RuntimePluginExtendsAPI<Extends>];
      });
    }
  });

  if (extendsHooks) {
    Object.keys(extendsHooks!).forEach(hookName => {
      extendsPluginApi[hookName as AllKeysForRuntimePluginExtendsAPI<Extends>] =
        (extendsHooks as Record<string, PluginHook<(...args: any[]) => any>>)[
          hookName
        ].tap as AllValueForRuntimePluginExtendsAPI<Extends>;
    });
  }

  const pluginAPI = {
    updateRuntimeContext,
    getHooks,
    getRuntimeConfig,
    config: hooks.config.tap,
    onBeforeRender: hooks.onBeforeRender.tap,
    wrapRoot: hooks.wrapRoot.tap,
    pickContext: hooks.pickContext.tap,
    ...extendsPluginApi,
  };

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
