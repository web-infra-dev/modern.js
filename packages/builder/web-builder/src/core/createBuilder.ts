import { pick } from '../shared';
import type { PluginStore, WebBuilderConfig } from '../types';
import { createCompiler } from './createCompiler';
import { createContext, createPublicContext } from './createContext';
import { createPluginStore } from './createPluginStore';
import { initConfigs } from './initConfigs';

export async function createBuilder(config: WebBuilderConfig = {}) {
  const context = await createContext(config);
  const pluginStore = await createPluginStore();

  await addDefaultPlugins(pluginStore);

  const builder = {
    ...pick(pluginStore, ['addPlugins', 'removePlugins', 'isPluginExists']),

    context: createPublicContext(context),

    createCompiler: async () => {
      await initConfigs({ context, pluginStore });
      return createCompiler(context);
    },
  };

  return builder;
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
