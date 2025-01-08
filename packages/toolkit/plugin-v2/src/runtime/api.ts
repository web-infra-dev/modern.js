import { merge } from '@modern-js/runtime-utils/merge';
import type { PluginHook, PluginHookTap } from '../types';
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
  function getRuntimeConfig() {
    if (context.config) {
      return context.config;
    }
    throw new Error('Cannot access config');
  }

  const extendsPluginApi: Record<
    string,
    PluginHookTap<(...args: any[]) => any>
  > = {};

  plugins.forEach(plugin => {
    const { _registryApi } = plugin;
    if (_registryApi) {
      const apis = _registryApi(getRuntimeContext, updateRuntimeContext);
      Object.keys(apis).forEach(apiName => {
        extendsPluginApi[apiName] = apis[apiName];
      });
    }
  });

  if (extendsHooks) {
    Object.keys(extendsHooks!).forEach(hookName => {
      extendsPluginApi[hookName] = (
        extendsHooks as Record<string, PluginHook<(...args: any[]) => any>>
      )[hookName].tap;
    });
  }

  return {
    getRuntimeContext,
    updateRuntimeContext,
    getRuntimeConfig,
    modifyRuntimeConfig: hooks.modifyRuntimeConfig.tap,
    onBeforeRender: hooks.onBeforeRender.tap,
    wrapRoot: hooks.wrapRoot.tap,
    pickContext: hooks.pickContext.tap,
    ...extendsPluginApi,
  };
}
