import { pick } from '../shared';
import type { WebBuilderConfig } from '../types';
import { createCompiler } from './createCompiler';
import { createContext, createPublicContext } from './createContext';
import { createPluginStore } from './createPluginStore';

export async function createBuilder(config: WebBuilderConfig = {}) {
  const context = await createContext(config);
  const pluginStore = await createPluginStore();
  const publicContext = createPublicContext(context);

  const builder = {
    context: publicContext,
    createCompiler: async () => createCompiler({ context, pluginStore }),
    ...pick(pluginStore, ['addPlugins', 'removePlugins', 'isPluginExists']),
  };

  return builder;
}
