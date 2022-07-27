import type {
  Context,
  PluginStore,
  WebBuilderPluginAPI,
  ModifyWebpackChainFn,
  ModifyWebpackConfigFn,
  ModifyBuilderConfigFn,
} from '../types';
import { createAsyncHook } from './createHook';
import { createPublicContext } from './createContext';

export async function initPlugins({
  context,
  pluginStore,
}: {
  context: Context;
  pluginStore: PluginStore;
}) {
  const publicContext = createPublicContext(context);

  const modifyWebpackChainHook = createAsyncHook<ModifyWebpackChainFn>();
  const modifyWebpackConfigHook = createAsyncHook<ModifyWebpackConfigFn>();
  const modifyBuilderConfigHook = createAsyncHook<ModifyBuilderConfigFn>();

  const getBuilderConfig = () => context.config;

  const pluginAPI: WebBuilderPluginAPI = {
    context: publicContext,
    getBuilderConfig,
    isPluginExists: pluginStore.isPluginExists,
    modifyWebpackChain: modifyWebpackChainHook.tap,
    modifyWebpackConfig: modifyWebpackConfigHook.tap,
    modifyBuilderConfig: modifyBuilderConfigHook.tap,
  };

  for (const plugin of pluginStore.plugins) {
    await plugin.setup(pluginAPI);
  }

  return {
    modifyWebpackChainHook,
    modifyWebpackConfigHook,
    modifyBuilderConfigHook,
  };
}
