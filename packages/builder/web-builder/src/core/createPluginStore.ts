import { warn } from '../shared';
import type { PluginStore, BuilderPlugin } from '../types';

export async function createPluginStore(): Promise<PluginStore> {
  let plugins: BuilderPlugin[] = [];

  const addPlugins = (newPlugins: BuilderPlugin[]) => {
    newPlugins.forEach(newPlugin => {
      if (plugins.find(item => item.name === newPlugin.name)) {
        warn(`Plugin "${newPlugin.name}" already exists.`);
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
    plugins,
    addPlugins,
    removePlugins,
    isPluginExists,
  };
}
