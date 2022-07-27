import { createAsyncHook } from '../shared/createAyncHook';
import type {
  Context,
  PluginStore,
  WebBuilderPluginAPI,
  ModifyWebpackChainFn,
  ModifyWebpackConfigFn,
  ModifyBuilderConfigFn,
} from '../types';
import { createPublicContext } from './createContext';

export function setupPlugins({
  context,
  pluginStore,
}: {
  context: Context;
  pluginStore: PluginStore;
}) {
  const publicContext = createPublicContext(context);

  // hooks
  const modifyWebpackChainHook = createAsyncHook<ModifyWebpackChainFn>();
  const modifyWebpackConfigHook = createAsyncHook<ModifyWebpackConfigFn>();
  const modifyBuilderConfigHook = createAsyncHook<ModifyBuilderConfigFn>();

  const pluginAPI: WebBuilderPluginAPI = {
    context: publicContext,
    isPluginExists: pluginStore.isPluginExists,
    modifyWebpackChain: modifyWebpackChainHook.tap,
    modifyWebpackConfig: modifyWebpackConfigHook.tap,
    modifyBuilderConfig: modifyBuilderConfigHook.tap,
  };

  pluginStore.plugins.forEach(plugin => plugin.setup(pluginAPI));

  return {
    modifyWebpackChainHook,
    modifyWebpackConfigHook,
    modifyBuilderConfigHook,
  };
}
