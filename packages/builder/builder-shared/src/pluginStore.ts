import { logger, debug } from './logger';
import type {
  PluginStore,
  BuilderPlugin,
  DefaultBuilderPluginAPI,
} from './types';

export function createPluginStore(): PluginStore {
  let plugins: BuilderPlugin[] = [];

  const addPlugins = (
    newPlugins: BuilderPlugin[],
    options?: { before?: string },
  ) => {
    const { before } = options || {};
    newPlugins.forEach(newPlugin => {
      if (typeof newPlugin !== 'object' || newPlugin === null) {
        throw new Error(
          `expect plugin instance is object, but got ${typeof newPlugin}.`,
        );
      } else if (typeof newPlugin.setup !== 'function') {
        throw new Error(
          `expect plugin.setup is function, but got ${typeof newPlugin}.`,
        );
      }
      if (plugins.find(item => item.name === newPlugin.name)) {
        logger.warn(`Plugin "${newPlugin.name}" already exists.`);
      } else if (before) {
        const index = plugins.findIndex(item => item.name === before);
        if (index === -1) {
          logger.warn(`Plugin "${before}" does not exist.`);
          plugins.push(newPlugin);
        } else {
          plugins.splice(index, 0, newPlugin);
        }
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

export async function initPlugins({
  pluginAPI,
  pluginStore,
}: {
  pluginAPI?: DefaultBuilderPluginAPI;
  pluginStore: PluginStore;
}) {
  debug('init plugins');

  const { pluginDagSort } = await import(
    '@modern-js/utils/universal/plugin-dag-sort'
  );

  const plugins = pluginDagSort(pluginStore.plugins);

  const removedPlugins = plugins.reduce<string[]>((ret, plugin) => {
    if (plugin.remove) {
      return ret.concat(plugin.remove);
    }
    return ret;
  }, []);

  for (const plugin of plugins) {
    if (removedPlugins.includes(plugin.name)) {
      continue;
    }
    await plugin.setup(pluginAPI);
  }

  debug('init plugins done');
}
