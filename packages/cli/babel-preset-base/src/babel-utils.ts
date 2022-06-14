import type { TransformOptions, PluginItem } from '@babel/core';

const ensureArray = <T>(params: T | T[]): T[] => {
  if (Array.isArray(params)) {
    return params;
  }
  return [params];
};

const getPluginItemName = (item: PluginItem) => {
  if (typeof item === 'string') {
    return item;
  }
  if (Array.isArray(item) && typeof item[0] === 'string') {
    return item[0];
  }
  return null;
};

const addPlugins = (plugins: PluginItem[], config: TransformOptions) => {
  if (config.plugins) {
    config.plugins.push(...plugins);
  } else {
    config.plugins = plugins;
  }
};

const addPresets = (presets: PluginItem[], config: TransformOptions) => {
  if (config.presets) {
    config.presets.push(...presets);
  } else {
    config.presets = presets;
  }
};

const removePlugins = (
  plugins: string | string[],
  config: TransformOptions,
) => {
  if (!config.plugins) {
    return;
  }

  const removeList = ensureArray(plugins);

  config.plugins = config.plugins.filter((item: PluginItem) => {
    const name = getPluginItemName(item);
    if (name) {
      return !removeList.find(removeItem => name.includes(removeItem));
    }
    return true;
  });
};

const removePresets = (
  presets: string | string[],
  config: TransformOptions,
) => {
  if (!config.presets) {
    return;
  }

  const removeList = ensureArray(presets);

  config.presets = config.presets.filter((item: PluginItem) => {
    const name = getPluginItemName(item);
    if (name) {
      return !removeList.find(removeItem => name.includes(removeItem));
    }
    return true;
  });
};

export const getBabelUtils = (config: TransformOptions) => ({
  addPlugins: (plugins: PluginItem[]) => addPlugins(plugins, config),
  addPresets: (presets: PluginItem[]) => addPresets(presets, config),
  removePlugins: (plugins: string | string[]) => removePlugins(plugins, config),
  removePresets: (presets: string | string[]) => removePresets(presets, config),
});
