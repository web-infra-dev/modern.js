import type {
  Context,
  OnExitFn,
  PluginStore,
  OnAfterBuildFn,
  OnBeforeBuildFn,
  WebBuilderPluginAPI,
  ModifyWebpackChainFn,
  ModifyWebpackConfigFn,
  ModifyBuilderConfigFn,
  OnAfterCreateCompilerFn,
  OnBeforeCreateCompilerFn,
} from '../types';
import { STATUS } from '../shared';
import { createAsyncHook } from './createHook';
import { createPublicContext } from './createContext';

export async function initPlugins({
  context,
  pluginStore,
}: {
  context: Context;
  pluginStore: PluginStore;
}) {
  context.setStatus(STATUS.BEFORE_INIT_PLUGINS);

  const publicContext = createPublicContext(context);

  const onExitHook = createAsyncHook<OnExitFn>();
  const onAfterBuildHook = createAsyncHook<OnAfterBuildFn>();
  const onBeforeBuildHook = createAsyncHook<OnBeforeBuildFn>();
  const modifyWebpackChainHook = createAsyncHook<ModifyWebpackChainFn>();
  const modifyWebpackConfigHook = createAsyncHook<ModifyWebpackConfigFn>();
  const modifyBuilderConfigHook = createAsyncHook<ModifyBuilderConfigFn>();
  const onAfterCreateCompilerHooks = createAsyncHook<OnAfterCreateCompilerFn>();
  const onBeforeCreateCompilerHooks =
    createAsyncHook<OnBeforeCreateCompilerFn>();

  const getBuilderConfig = () => context.config;

  const pluginAPI: WebBuilderPluginAPI = {
    context: publicContext,
    getBuilderConfig,
    isPluginExists: pluginStore.isPluginExists,

    // Hooks
    onExit: onExitHook.tap,
    onAfterBuild: onAfterBuildHook.tap,
    onBeforeBuild: onBeforeBuildHook.tap,
    onAfterCreateCompiler: onAfterCreateCompilerHooks.tap,
    onBeforeCreateCompiler: onBeforeCreateCompilerHooks.tap,

    // Modifiers
    modifyWebpackChain: modifyWebpackChainHook.tap,
    modifyWebpackConfig: modifyWebpackConfigHook.tap,
    modifyBuilderConfig: modifyBuilderConfigHook.tap,
  };

  for (const plugin of pluginStore.plugins) {
    await plugin.setup(pluginAPI);
  }

  context.setStatus(STATUS.AFTER_INIT_PLUGINS);

  return {
    onExitHook,
    onAfterBuildHook,
    onBeforeBuildHook,
    onAfterCreateCompilerHooks,
    onBeforeCreateCompilerHooks,
    modifyWebpackChainHook,
    modifyWebpackConfigHook,
    modifyBuilderConfigHook,
  };
}
