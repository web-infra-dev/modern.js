import { pick } from '../shared';
import type { PluginStore, WebBuilderConfig } from '../types';
import { createCompiler } from './createCompiler';
import { createContext, createPublicContext } from './createContext';
import { createPluginStore } from './createPluginStore';

export async function createBuilder(config: WebBuilderConfig = {}) {
  const context = await createContext(config);
  const pluginStore = await createPluginStore();
  const publicContext = createPublicContext(context);

  await addDefaultPlugins(pluginStore);

  const builder = {
    context: publicContext,
    createCompiler: async () => createCompiler({ context, pluginStore }),
    ...pick(pluginStore, ['addPlugins', 'removePlugins', 'isPluginExists']),
  };

  return builder;
}

async function addDefaultPlugins(pluginStore: PluginStore) {
  const { PluginMode } = await import('../plugins/mode');

  pluginStore.addPlugins([PluginMode()]);
}
