import { isFunction } from '@modern-js/utils/lodash';
import type { Plugin, PluginManager } from './types/plugin';
import type { Falsy } from './types/utils';

// Validates if the plugin is a valid plugin instance
function validatePlugin(plugin: unknown) {
  const type = typeof plugin;

  if (type !== 'object' || plugin === null) {
    throw new Error(
      `Expect CLI Plugin instance to be an object, but got ${type}.`,
    );
  }

  if (!(plugin as Plugin).setup) return;

  if (isFunction((plugin as Plugin).setup)) {
    return;
  }

  throw new Error(
    `Expect CLI Plugin plugin.setup to be a function, but got ${type}.`,
  );
}

export function createPluginManager(): PluginManager {
  // Map to store all plugins by name
  const plugins = new Map<string, Plugin>();
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
      if (
        !dependencies.get(plugin)!.post.has(dependency) &&
        !dependencies.get(dependency)!.pre.has(plugin)
      ) {
        dependencies
          .get(plugin)!
          .pre.set(dependency, { name: dependency, isUse: true });
      }
    }
  };

  const addPlugin = (newPlugin: Plugin | Falsy) => {
    if (!newPlugin) {
      return;
    }
    validatePlugin(newPlugin);
    const { name, usePlugins = [], pre = [], post = [] } = newPlugin;
    if (plugins.has(name)) {
      console.warn(`Plugin ${name} already exists.`);
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

  const addPlugins = (newPlugins: Array<Plugin | Falsy>) => {
    for (const newPlugin of newPlugins) {
      addPlugin(newPlugin);
    }
  };

  const getPlugins = () => {
    const visited = new Set();
    const temp = new Set();
    let result: Plugin[] = [];
    const visit = (name: string) => {
      if (temp.has(name)) {
        throw new Error(`Circular dependency detected: ${name}`);
      }
      if (!visited.has(name) && plugins.get(name)) {
        temp.add(name);
        const { required = [] } = plugins.get(name)!;
        required.forEach(dep => {
          if (!plugins.get(dep)) {
            throw new Error(
              `${name} plugin required plugin ${dep}, but not found.`,
            );
          }
        });
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

    result = result.filter(result => result);

    return result;
  };

  const clear = () => {
    plugins.clear();
    dependencies.clear();
  };

  return {
    getPlugins,
    addPlugins,
    clear,
    isPluginExists: (name: string) => plugins.has(name),
  };
}
