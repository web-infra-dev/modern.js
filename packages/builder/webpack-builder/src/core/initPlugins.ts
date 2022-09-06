import type { Context, PluginStore, BuilderPluginAPI } from '../types';
import { debug } from '../shared';
import { createPublicContext } from './createContext';

export async function initPlugins({
  context,
  pluginStore,
}: {
  context: Context;
  pluginStore: PluginStore;
}) {
  debug('init plugins');
  const { hooks } = context;
  const publicContext = createPublicContext(context);

  const getBuilderConfig = () => context.config;

  const pluginAPI: BuilderPluginAPI = {
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
    onBeforeStartDevServer: hooks.onBeforeStartDevServerHooks.tap,
  };

  for (const plugin of pluginStore.plugins) {
    await plugin.setup(pluginAPI);
  }

  debug('init plugins done');
}
