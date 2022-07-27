import type { PluginStore, WebBuilderPlugin } from '../types';

export async function createPluginStore(): Promise<PluginStore> {
  let plugins: WebBuilderPlugin[] = [];

  const addPlugins = (plugins: WebBuilderPlugin[]) => {
    plugins.push(...plugins);
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
