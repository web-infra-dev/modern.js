import { isAbsolute, sep } from 'path';
import {
  BabelConfig,
  BabelConfigUtils,
  BabelTransformOptions,
  BabelPlugin,
  PresetEnvOptions,
  PresetReactOptions,
  BabelPluginOptions,
} from '@modern-js/types';
import { applyOptionsChain } from './applyOptionsChain';
import { ensureArray } from './ensureArray';
import { normalizeToPosixPath } from './path';

// compatible with windows path
const formatPath = (originPath: string) => {
  if (isAbsolute(originPath)) {
    return originPath.split(sep).join('/');
  }
  return originPath;
};

const getPluginItemName = (item: BabelPlugin) => {
  if (typeof item === 'string') {
    return formatPath(item);
  }
  if (Array.isArray(item) && typeof item[0] === 'string') {
    return formatPath(item[0]);
  }
  return null;
};

const addPlugins = (plugins: BabelPlugin[], config: BabelTransformOptions) => {
  if (config.plugins) {
    config.plugins.push(...plugins);
  } else {
    config.plugins = plugins;
  }
};

const addPresets = (presets: BabelPlugin[], config: BabelTransformOptions) => {
  if (config.presets) {
    config.presets.push(...presets);
  } else {
    config.presets = presets;
  }
};

const removePlugins = (
  plugins: string | string[],
  config: BabelTransformOptions,
) => {
  if (!config.plugins) {
    return;
  }

  const removeList = ensureArray(plugins);

  config.plugins = config.plugins.filter((item: BabelPlugin) => {
    const name = getPluginItemName(item);
    if (name) {
      return !removeList.find(removeItem => name.includes(removeItem));
    }
    return true;
  });
};

const removePresets = (
  presets: string | string[],
  config: BabelTransformOptions,
) => {
  if (!config.presets) {
    return;
  }

  const removeList = ensureArray(presets);

  config.presets = config.presets.filter((item: BabelPlugin) => {
    const name = getPluginItemName(item);
    if (name) {
      return !removeList.find(removeItem => name.includes(removeItem));
    }
    return true;
  });
};

const modifyPresetOptions = <T>(
  presetName: string,
  options: T,
  presets: BabelPlugin[] = [],
) => {
  presets.forEach((preset: BabelPlugin, index) => {
    // 1. ['@babel/preset-env', ...]
    if (Array.isArray(preset)) {
      if (
        typeof preset[0] === 'string' &&
        normalizeToPosixPath(preset[0]).includes(presetName)
      ) {
        preset[1] = {
          ...(preset[1] || {}),
          ...options,
          // `options` is specific to different presets
        } as unknown as BabelPluginOptions;
      }
    } else if (
      typeof preset === 'string' &&
      normalizeToPosixPath(preset).includes(presetName)
    ) {
      // 2. '@babel/preset-env'
      presets[index] = [preset, options];
    }
  });
};

export const getBabelUtils = (
  config: BabelTransformOptions,
): BabelConfigUtils => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const noop = () => {};
  return {
    addPlugins: (plugins: BabelPlugin[]) => addPlugins(plugins, config),
    addPresets: (presets: BabelPlugin[]) => addPresets(presets, config),
    removePlugins: (plugins: string | string[]) =>
      removePlugins(plugins, config),
    removePresets: (presets: string | string[]) =>
      removePresets(presets, config),
    // `addIncludes` and `addExcludes` are noop functions by default,
    // It can be overridden by `extraBabelUtils`.
    addIncludes: noop,
    addExcludes: noop,
    // Compat `presetEnvOptions` and `presetReactOptions` in Eden.
    modifyPresetEnvOptions: (options: PresetEnvOptions) =>
      modifyPresetOptions('@babel/preset-env', options, config.presets || []),
    modifyPresetReactOptions: (options: PresetReactOptions) =>
      modifyPresetOptions('@babel/preset-react', options, config.presets || []),
  };
};

export const applyUserBabelConfig = (
  defaultOptions: BabelTransformOptions,
  userBabelConfig?: BabelConfig | BabelConfig[],
  extraBabelUtils?: Partial<BabelConfigUtils>,
): BabelTransformOptions => {
  if (userBabelConfig) {
    const babelUtils = {
      ...getBabelUtils(defaultOptions),
      ...extraBabelUtils,
    } as BabelConfigUtils;

    return applyOptionsChain(defaultOptions, userBabelConfig || {}, babelUtils);
  }

  return defaultOptions;
};
