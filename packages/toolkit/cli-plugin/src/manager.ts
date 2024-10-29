import { isFunction, logger } from '@modern-js/utils';
import type { CLIPlugin, PluginManager } from './types/plugin';
import type { Falsy } from './types/utils';

function validatePlugin(plugin: unknown) {
  const type = typeof plugin;

  if (type !== 'object' || plugin === null) {
    throw new Error(
      `Expect CLI Plugin instance to be an object, but got ${type}.`,
    );
  }

  if (isFunction((plugin as CLIPlugin).setup)) {
    return;
  }

  throw new Error(
    `Expect CLI Plugin plugin.setup to be a function, but got ${type}.`,
  );
}

export function createPluginManager(): PluginManager {
  let plugins: CLIPlugin[] = [];

  const addPlugins = (
    newPlugins: Array<CLIPlugin | Falsy>,
    options?: { before?: string },
  ) => {
    const { before } = options || {};

    for (const newPlugin of newPlugins) {
      if (!newPlugin) {
        continue;
      }

      validatePlugin(newPlugin);

      if (before) {
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
    }
  };

  const removePlugins = (pluginNames: string[]) => {
    plugins = plugins.filter(plugin => !pluginNames.includes(plugin.name));
  };

  const isPluginExists = (pluginName: string) =>
    Boolean(plugins.find(plugin => plugin.name === pluginName));

  const getPlugins = () => plugins;
  return {
    getPlugins,
    addPlugins,
    removePlugins,
    isPluginExists,
  };
}
