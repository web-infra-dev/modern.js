import { merge } from '@modern-js/utils/lodash';
import type { PluginHookTap } from '../types';
import type { PluginManager } from '../types/plugin';
import type { RuntimePluginAPI } from '../types/runtime/api';
import type { InternalContext, RuntimeContext } from '../types/runtime/context';
import type { RuntimePluginExtends } from '../types/runtime/plugin';
import type { DeepPartial } from '../types/utils';

export function initPluginAPI<Extends extends RuntimePluginExtends>({
  context,
}: {
  context: InternalContext<Extends>;
  pluginManager: PluginManager;
}): RuntimePluginAPI<Extends> {
  const { hooks, plugins } = context;

  function getRuntimeContext() {
    if (context) {
      const { hooks, extendsHooks, config, pluginAPI, ...runtimeContext } =
        context;
      return runtimeContext as RuntimeContext<Extends> &
        Extends['extendContext'];
    }
    throw new Error('Cannot access context');
  }

  function updateRuntimeContext(
    updateContext: DeepPartial<RuntimeContext<Extends>>,
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
