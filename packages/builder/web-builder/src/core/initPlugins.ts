import type { Context, PluginStore, WebBuilderPluginAPI } from '../types';
import { STATUS } from '../shared';
import { createPublicContext } from './createContext';

export async function initPlugins({
  context,
  pluginStore,
}: {
  context: Context;
  pluginStore: PluginStore;
}) {
  context.status = STATUS.BEFORE_INIT_PLUGINS;

  const { hooks } = context;
  const publicContext = createPublicContext(context);

  const getBuilderConfig = () => context.config;

  const pluginAPI: WebBuilderPluginAPI = {
    context: publicContext,
    getBuilderConfig,
    isPluginExists: pluginStore.isPluginExists,

    // Hooks
    onExit: hooks.onExitHook.tap,
    onAfterBuild: hooks.onAfterBuildHook.tap,
    onBeforeBuild: hooks.onBeforeBuildHook.tap,
    modifyWebpackChain: hooks.modifyWebpackChainHook.tap,
    modifyWebpackConfig: hooks.modifyWebpackConfigHook.tap,
    modifyBuilderConfig: hooks.modifyBuilderConfigHook.tap,
    onAfterCreateCompiler: hooks.onAfterCreateCompilerHooks.tap,
    onBeforeCreateCompiler: hooks.onBeforeCreateCompilerHooks.tap,
  };

  for (const plugin of pluginStore.plugins) {
    await plugin.setup(pluginAPI);
  }

  context.status = STATUS.AFTER_INIT_PLUGINS;
}
