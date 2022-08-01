import { pick } from '../shared';
import { createContext, createPublicContext } from './createContext';
import { createPluginStore } from './createPluginStore';
import { initConfigs } from './initConfigs';
import type { PluginStore, WebBuilderConfig } from '../types';

export type CreateBuilderOptions = {
  cwd?: string;
  builderConfig?: WebBuilderConfig;
};

export async function createBuilder(options: CreateBuilderOptions = {}) {
  const cwd = options.cwd || process.cwd();
  const builderConfig = options.builderConfig || {};
  const context = await createContext(cwd, builderConfig);
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
  const { PluginDevtool } = await import('../plugins/devtool');
  const { PluginProgress } = await import('../plugins/progress');

  pluginStore.addPlugins([
    // Plugins that provide basic webpack config
    PluginMode(),
    PluginDevtool(),

    // Plugins that provide basic webpack plugins
    PluginProgress(),
  ]);
}
