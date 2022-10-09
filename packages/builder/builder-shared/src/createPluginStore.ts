import { logger } from './logger';
import type { PluginStore, BuilderPlugin } from './types';

export function createPluginStore(): PluginStore {
  let plugins: BuilderPlugin[] = [];

  const addPlugins = (newPlugins: BuilderPlugin[]) => {
    newPlugins.forEach(newPlugin => {
      if (plugins.find(item => item.name === newPlugin.name)) {
        logger.warn(`Plugin "${newPlugin.name}" already exists.`);
      } else {
        plugins.push(newPlugin);
      }
    });
  };

  const removePlugins = (pluginNames: string[]) => {
    plugins = plugins.filter(plugin => !pluginNames.includes(plugin.name));
  };

  const isPluginExists = (pluginName: string) =>
    Boolean(plugins.find(plugin => plugin.name === pluginName));

  return {
    get plugins() {
      return plugins;
    },
    addPlugins,
    removePlugins,
    isPluginExists,
  };
}
