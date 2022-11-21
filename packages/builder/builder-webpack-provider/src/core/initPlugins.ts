import {
  debug,
  onExitProcess,
  createPublicContext,
  getHTMLPathByEntry,
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

  const getBuilderConfig = () => {
    if (!context.normalizedConfig) {
      throw new Error(
        'Cannot access builder config until modifyBuilderConfig is called.',
      );
    }
    return context.config;
  };

  const getNormalizedConfig = () => {
    if (!context.normalizedConfig) {
      throw new Error(
        'Cannot access normalized config until modifyBuilderConfig is called.',
      );
    }
    return context.normalizedConfig;
  };

  const getHTMLPaths = () => {
    return Object.keys(context.entry).reduce<Record<string, string>>(
      (prev, key) => {
        prev[key] = getHTMLPathByEntry(key, getNormalizedConfig());
        return prev;
      },
      {},
    );
  };

  const pluginAPI: BuilderPluginAPI = {
    context: publicContext,
    getHTMLPaths,
    getBuilderConfig,
    getNormalizedConfig,
    isPluginExists: pluginStore.isPluginExists,

    // Hooks
    onExit: hooks.onExitHook.tap,
    onAfterBuild: hooks.onAfterBuildHook.tap,
    onBeforeBuild: hooks.onBeforeBuildHook.tap,
    onDevCompileDone: hooks.onDevCompileDoneHook.tap,
    modifyWebpackChain: hooks.modifyWebpackChainHook.tap,
    modifyWebpackConfig: hooks.modifyWebpackConfigHook.tap,
    modifyBuilderConfig: hooks.modifyBuilderConfigHook.tap,
    onAfterCreateCompiler: hooks.onAfterCreateCompilerHook.tap,
    onBeforeCreateCompiler: hooks.onBeforeCreateCompilerHook.tap,
    onAfterStartDevServer: hooks.onAfterStartDevServerHook.tap,
    onBeforeStartDevServer: hooks.onBeforeStartDevServerHook.tap,
  };

  for (const plugin of pluginStore.plugins) {
    await plugin.setup(pluginAPI);
  }

  onExitProcess(() => {
    hooks.onExitHook.call();
  });

  debug('init plugins done');
}
