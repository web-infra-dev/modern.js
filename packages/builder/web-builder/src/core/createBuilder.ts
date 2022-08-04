import { pick } from '../shared';
import { createContext, createPublicContext } from './createContext';
import { createPluginStore } from './createPluginStore';
import { initConfigs } from './initConfigs';
import type { PluginStore, BuilderOptions } from '../types';

function mergeBuilderOptions(options?: BuilderOptions) {
  const DEFAULT_OPTIONS: Required<BuilderOptions> = {
    cwd: process.cwd(),
    target: ['web'],
    configPath: null,
    builderConfig: {},
  };

  return {
    ...DEFAULT_OPTIONS,
    ...options,
  };
}

export async function createBuilder(options?: BuilderOptions) {
  const builderOptions = mergeBuilderOptions(options);
  const context = await createContext(builderOptions);
  const publicContext = createPublicContext(context);
  const pluginStore = await createPluginStore();

  await addDefaultPlugins(pluginStore);

  const build = async () => {
    const { build } = await import('./build');
    const { webpackConfigs } = await initConfigs({
      context,
      pluginStore,
      builderOptions,
    });
    return build({ context, webpackConfigs });
  };

  const createCompiler = async () => {
    const { createCompiler } = await import('./createCompiler');
    const { webpackConfigs } = await initConfigs({
      context,
      pluginStore,
      builderOptions,
    });
    return createCompiler({ context, webpackConfigs });
  };

  return {
    ...pick(pluginStore, ['addPlugins', 'removePlugins', 'isPluginExists']),
    build,
    context: publicContext,
    createCompiler,
  };
}

async function addDefaultPlugins(pluginStore: PluginStore) {
  const { PluginMode } = await import('../plugins/mode');
  const { PluginCopy } = await import('../plugins/copy');
  const { PluginCache } = await import('../plugins/cache');
  const { PluginTarget } = await import('../plugins/target');
  const { PluginMoment } = await import('../plugins/moment');
  const { PluginDevtool } = await import('../plugins/devtool');
  const { PluginProgress } = await import('../plugins/progress');
  const { PluginMinimize } = await import('../plugins/minimize');
  const { PluginCleanOutput } = await import('../plugins/cleanOutput');

  pluginStore.addPlugins([
    // Plugins that provide basic webpack config
    PluginMode(),
    PluginCache(),
    PluginTarget(),
    PluginDevtool(),

    // Plugins that provide basic features
    PluginCopy(),
    PluginMoment(),
    PluginProgress(),
    PluginMinimize(),
    PluginCleanOutput(),
  ]);
}
