import { createDebugger } from '@modern-js/utils';
import { assign } from '@modern-js/utils/lodash';
import type { PluginHook } from '../types';
import type { PluginManager } from '../types/plugin';
import type {
  AllKeysForServerPluginExtendsAPI,
  AllValueForServerPluginExtendsAPI,
  ServerPluginAPI,
  ServerPluginExtendsAPI,
} from '../types/server/api';
import type {
  InternalServerContext,
  ServerContext,
} from '../types/server/context';
import type { ServerPluginExtends } from '../types/server/plugin';
import type { DeepPartial } from '../types/utils';

export const debug = createDebugger('plugin-server-v2');

export function initPluginAPI<Extends extends ServerPluginExtends>({
  context,
  pluginManager,
}: {
  context: InternalServerContext<Extends>;
  pluginManager: PluginManager;
}): ServerPluginAPI<Extends> {
  const { hooks, extendsHooks, plugins } = context;
  function getServerContext() {
    if (context) {
      const { hooks, extendsHooks, config, pluginAPI, ...serverContext } =
        context;
      serverContext._internalContext = context;
      return serverContext as ServerContext<Extends> & Extends['extendContext'];
    }
    throw new Error('Cannot access context');
  }

  function getConfig() {
    if (context.config) {
      return context.config;
    }
    throw new Error('Cannot access config');
  }

  function getHooks() {
    return context.hooks;
  }

  const extendsPluginApi: Partial<ServerPluginExtendsAPI<Extends>> = {};

  plugins.forEach(plugin => {
    const { _registryApi } = plugin;
    if (_registryApi) {
      const apis = _registryApi(getServerContext, updateServerContext);
      Object.keys(apis).forEach(apiName => {
        extendsPluginApi[apiName as AllKeysForServerPluginExtendsAPI<Extends>] =
          apis[apiName] as AllValueForServerPluginExtendsAPI<Extends>;
      });
    }
  });

  if (extendsHooks) {
    Object.keys(extendsHooks!).forEach(hookName => {
      extendsPluginApi[hookName as AllKeysForServerPluginExtendsAPI<Extends>] =
        (extendsHooks as Record<string, PluginHook<(...args: any[]) => any>>)[
          hookName
        ].tap as AllValueForServerPluginExtendsAPI<Extends>;
    });
  }

  function updateServerContext(
    updateContext: DeepPartial<ServerContext<Extends>>,
  ) {
    context = assign(context, updateContext);
  }

  // TODO: Add type in next major version when remove `Proxy`
  const pluginAPI = {
    isPluginExists: pluginManager.isPluginExists,
    getServerContext,
    getServerConfig: getConfig,
    getHooks,
    updateServerContext,

    modifyConfig: hooks.modifyConfig.tap,
    onPrepare: hooks.onPrepare.tap,
    onReset: hooks.onReset.tap,
    ...extendsPluginApi,
  };

  if (typeof Proxy === 'undefined') {
    return pluginAPI as ServerPluginAPI<Extends>;
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
        debug(`api.${prop.toString()} not exist`);
      };
    },
  }) as ServerPluginAPI<Extends>;
}
