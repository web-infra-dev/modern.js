import {
  debug,
  createPublicContext,
  type PluginStore,
} from '@modern-js/builder-shared';
import type { Context, BuilderPluginAPI } from '../types';

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
    onDevCompileDone: hooks.onDevCompileDoneHook.tap,
    modifyWebpackChain: hooks.modifyWebpackChainHook.tap,
    modifyWebpackConfig: hooks.modifyWebpackConfigHook.tap,
    modifyBuilderConfig: hooks.modifyBuilderConfigHook.tap,
    onAfterCreateCompiler: hooks.onAfterCreateCompilerHooks.tap,
    onBeforeCreateCompiler: hooks.onBeforeCreateCompilerHooks.tap,
    onAfterStartDevServer: hooks.onAfterStartDevServerHooks.tap,
    onBeforeStartDevServer: hooks.onBeforeStartDevServerHooks.tap,
  };

  for (const plugin of pluginStore.plugins) {
    await plugin.setup(pluginAPI);
  }

  debug('init plugins done');
}
