import { pick } from '../shared';
import { createContext, createPublicContext } from './createContext';
import { createPluginStore } from './createPluginStore';
import { initConfigs } from './initConfigs';
import type { PluginStore, WebBuilderConfig } from '../types';

export type CreateBuilderOptions = {
  cwd?: string;
  configPath?: string;
  builderConfig?: WebBuilderConfig;
};

export async function createBuilder(options: CreateBuilderOptions = {}) {
  const context = await createContext(options);
  const publicContext = createPublicContext(context);
  const pluginStore = await createPluginStore();

  await addDefaultPlugins(pluginStore);

  const build = async () => {
    const { build } = await import('./build');
    const { webpackConfigs } = await initConfigs({ context, pluginStore });
    return build({ context, webpackConfigs });
  };

  const createCompiler = async () => {
    const { createCompiler } = await import('./createCompiler');
    const { webpackConfigs } = await initConfigs({ context, pluginStore });
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
  const { PluginCache } = await import('../plugins/cache');
  const { PluginDevtool } = await import('../plugins/devtool');
  const { PluginProgress } = await import('../plugins/progress');
  const { PluginMinimize } = await import('../plugins/minimize');

  pluginStore.addPlugins([
    // Plugins that provide basic webpack config
    PluginMode(),
    PluginCache(),
    PluginDevtool(),

    // Plugins that provide basic webpack plugins
    PluginProgress(),
    PluginMinimize(),
  ]);
}
