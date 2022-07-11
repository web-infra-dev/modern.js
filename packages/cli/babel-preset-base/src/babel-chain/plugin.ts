import type { PluginItem } from '@babel/core';

export type Plugin = {
  name: string;
  path?: string;
  options: any[];
};

export type PluginSetter = (name: string) => {
  tap: (options: any[]) => void;
  delete: () => void;
  ban: () => void;
  options: () => any[];
  filter: Plugin[]['filter'];
  use: (path: string, options?: any[]) => void;
};

export type BabelPluginChain = {
  plugin: PluginSetter;
  plugins: Plugin[];
  blacks: string[];
  toJSON: () => PluginItem[];
  merge: (other: BabelPluginChain) => BabelPluginChain;
};

export const createBabelPluginChain = (): BabelPluginChain => {
  let plugins: Plugin[] = [];

  const blacks: string[] = [];

  const plugin = (name: string) => {
    const pluginExist = plugins.find(plugin => plugin.name === name);
    const isExist = Boolean(pluginExist);
    const plugin = pluginExist || { name, options: [] };

    const tap = (options: any[]) => {
      plugin.options = options;
      set();
    };

    const options = (): any[] => plugin.options;

    const del = () => {
      if (isExist) {
        plugins = plugins.filter(plugin => !plugin.name.includes(name));
      }
    };

    const ban = () => {
      if (!blacks.includes(name)) {
        blacks.push(name);
      }
      del();
    };

    const set = () => {
      if (blacks.includes(name)) {
        throw new Error(`Plugin: ${name} has been banned!, You can't set it.`);
      }

      // merge preset with replacing
      // see https://babeljs.io/docs/en/configuration#how-babel-merges-config-items
      if (!isExist) {
        plugins.push(plugin);
      }
    };

    const use = (path: string, options?: any[]) => {
      plugin.path = path;
      plugin.options = options || [];
      set();
    };

    return {
      tap,
      delete: del,
      ban,
      options,
      filter: plugins.filter,
      use,
    };
  };

  const toJSON = (): PluginItem[] =>
    plugins.map(plugin =>
      plugin.options
        ? [plugin.path || plugin.name, ...plugin.options]
        : plugin.path || plugin.name,
    );

  // merge preset with replacing
  // see https://babeljs.io/docs/en/configuration#how-babel-merges-config-items
  const merge = (other: BabelPluginChain): BabelPluginChain => {
    for (const plugin of other.plugins) {
      if (plugin.path) {
        chain.plugin(plugin.name).use(plugin.path, plugin.options);
      } else {
        chain.plugin(plugin.name).tap(plugin.options);
      }
    }

    return chain;
  };

  const chain = {
    plugin,
    plugins,
    blacks,
    toJSON,
    merge,
  };

  return chain;
};
