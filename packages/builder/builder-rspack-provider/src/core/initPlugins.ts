import {
  debug,
  onExitProcess,
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
  const getNormalizedConfig = () => {
    if (!context.normalizedConfig) {
      throw new Error('Normalized config is not ready.');
    }
    return context.normalizedConfig;
  };

  const pluginAPI: BuilderPluginAPI = {
    context: publicContext,
    getBuilderConfig,
    getNormalizedConfig,
    isPluginExists: pluginStore.isPluginExists,

    // Hooks
    onExit: hooks.onExitHook.tap,
    onAfterBuild: hooks.onAfterBuildHook.tap,
    onBeforeBuild: hooks.onBeforeBuildHook.tap,
    onDevCompileDone: hooks.onDevCompileDoneHook.tap,
    modifyRspackConfig: hooks.modifyRspackConfigHook.tap,
    modifyBuilderConfig: hooks.modifyBuilderConfigHook.tap,
    // onAfterCreateCompiler: hooks.onAfterCreateCompilerHooks.tap,
    onBeforeCreateCompiler: hooks.onBeforeCreateCompilerHooks.tap,
    onAfterStartDevServer: hooks.onAfterStartDevServerHooks.tap,
    onBeforeStartDevServer: hooks.onBeforeStartDevServerHooks.tap,
  };

  for (const plugin of pluginStore.plugins) {
    await plugin.setup(pluginAPI);
  }

  onExitProcess(() => {
    hooks.onExitHook.call();
  });

  debug('init plugins done');
}
