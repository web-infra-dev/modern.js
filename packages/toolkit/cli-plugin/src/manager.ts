import { createDebugger, isFunction, logger } from '@modern-js/utils';
import type { CLIPlugin, PluginManager } from './types/plugin';
import type { Falsy } from './types/utils';

const debug = createDebugger('cli-plugin');
// Validates if the plugin is a valid CLIPlugin instance
function validatePlugin<Config, NormalizedConfig>(plugin: unknown) {
  const type = typeof plugin;

  if (type !== 'object' || plugin === null) {
    throw new Error(
      `Expect CLI Plugin instance to be an object, but got ${type}.`,
    );
  }

  if (isFunction((plugin as CLIPlugin<Config, NormalizedConfig>).setup)) {
    return;
  }

  throw new Error(
    `Expect CLI Plugin plugin.setup to be a function, but got ${type}.`,
  );
}

export function createPluginManager<Config, NormalizedConfig>(): PluginManager<
  Config,
  NormalizedConfig
> {
  // Map to store all plugins by name
  const plugins = new Map<string, CLIPlugin<Config, NormalizedConfig>>();
  // Map to store dependencies for each plugin
  // 'pre': plugins that must run before the current plugin
  // 'post': plugins that must run after the current plugin
  const dependencies = new Map<
    string,
    {
      pre: Map<string, { name: string; isUse: boolean }>; // isUse: if the plugin is used in the current plugin
      post: Map<string, { name: string }>;
    }
  >();

  // Adds a dependency relation between plugins
  const addDependency = (
    plugin: string,
    dependency: string,
    type: 'pre' | 'post' | 'use',
  ) => {
    if (!dependencies.has(dependency)) {
      dependencies.set(dependency, {
        pre: new Map(),
        post: new Map(),
      });
    }
    if (type === 'pre') {
      dependencies
        .get(plugin)!
        .pre.set(dependency, { name: dependency, isUse: false });
    } else if (type === 'post') {
      dependencies.get(plugin)!.post.set(dependency, { name: dependency });
    } else if (type === 'use') {
      // 'use' plugins are added to the 'pre' order if not already in 'post'
      if (!dependencies.get(plugin)!.post.has(dependency)) {
        dependencies
          .get(plugin)!
          .pre.set(dependency, { name: dependency, isUse: true });
      }
    }
  };

  const addPlugin = (
    newPlugin: CLIPlugin<Config, NormalizedConfig> | Falsy,
  ) => {
    if (!newPlugin) {
      return;
    }
    validatePlugin(newPlugin);
    const { name, usePlugins = [], pre = [], post = [] } = newPlugin;
    if (plugins.has(name)) {
      logger.warn(`Plugin ${name} already exists.`);
      return;
    }
    plugins.set(name, newPlugin);
    dependencies.set(name, { pre: new Map(), post: new Map() });

    pre.forEach(dep => {
      addDependency(name, dep, 'pre');
    });

    post.forEach(dep => {
      addDependency(name, dep, 'post');
    });

    // 'use' plugins are handled last to ensure correct dependency resolution
    usePlugins.forEach(plugin => {
      if (!plugins.has(plugin.name)) {
        addPlugin(plugin);
      }
      addDependency(name, plugin.name, 'use');
    });
  };

  const addPlugins = (
    newPlugins: Array<CLIPlugin<Config, NormalizedConfig> | Falsy>,
  ) => {
    for (const newPlugin of newPlugins) {
      addPlugin(newPlugin);
    }
  };

  const getPlugins = () => {
    const visited = new Set();
    const temp = new Set();
    const result: CLIPlugin<Config, NormalizedConfig>[] = [];
    const visit = (name: string) => {
      if (temp.has(name)) {
        throw new Error(`Circular dependency detected: ${name}`);
      }
      if (!visited.has(name)) {
        temp.add(name);
        const { pre } = dependencies.get(name)!;
        // Process 'pre' dependencies that are not 'use' plugins
        Array.from(pre.values())
          .filter(dep => !dep.isUse)
          .forEach(dep => visit(dep.name));
        // Process 'use' plugins
        Array.from(pre.values())
          .filter(dep => dep.isUse)
          .forEach(dep => visit(dep.name));
        temp.delete(name);
        visited.add(name);
        result.push(plugins.get(name)!);
      }
    };

    // Convert 'post' dependencies to 'pre' dependencies for processing
    plugins.forEach((_, name) => {
      const { post } = dependencies.get(name)!;
      post.forEach(dep => {
        if (!dependencies.get(dep.name)!.pre.has(name)) {
          dependencies.get(dep.name)!.pre.set(name, { name, isUse: false });
        }
      });
    });

    plugins.forEach((_, name) => {
      visit(name);
    });

    debug(
      'CLI Plugins:',
      result.map(p => p.name),
    );

    return result;
  };

  return {
    getPlugins,
    addPlugins,
  };
}
