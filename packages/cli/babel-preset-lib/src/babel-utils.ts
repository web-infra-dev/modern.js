import {
  TransformOptions,
  PluginTarget,
  PluginOptions,
  PluginItem,
} from '@babel/core';

const ensureArrayParams = (params: [] | any) => {
  if (!Array.isArray(params)) {
    return [params];
  }
  return params;
};

const addBabelPlugins = (plugins: PluginItem[], config: TransformOptions) => {
  const userPlugins = ensureArrayParams(plugins);
  (config.plugins as PluginItem[]).push(...userPlugins);
};

const removeBabelPlugins = (plugins: string[], config: TransformOptions) => {
  const internalPlugins = config.plugins || [];
  config.plugins = internalPlugins.filter((p: PluginItem) => {
    const pluginName = (p as [PluginTarget, PluginOptions])[0];
    return !plugins.includes(pluginName as string);
  });
};

const addBabelPresets = (presets: PluginItem[], config: TransformOptions) => {
  const userPresets = ensureArrayParams(presets);
  (config.presets as PluginItem[]).push(...userPresets);
};

const removeBabelPresets = (presets: string[], config: TransformOptions) => {
  const internalPresets = config.presets || [];
  config.presets = internalPresets.filter((p: PluginItem) => {
    const presetName = (p as [PluginTarget, PluginOptions])[0];
    return !presets.includes(presetName as string);
  });
};

export const getBabelUtils = (config: TransformOptions) => ({
  addPlugins: (plugins: PluginItem[]) => addBabelPlugins(plugins, config),
  removePlugins: (plugins: string[]) => removeBabelPlugins(plugins, config),
  addPresets: (presets: PluginItem[]) => addBabelPresets(presets, config),
  removePresets: (presets: string[]) => removeBabelPresets(presets, config),
});
