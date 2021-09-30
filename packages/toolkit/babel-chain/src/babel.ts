import type { TransformOptions, PluginItem } from '@babel/core';
import {
  BabelPresetChain,
  PresetSetter,
  createBabelPresetChain,
} from './preset';
import {
  BabelPluginChain,
  PluginSetter,
  createBabelPluginChain,
} from './plugin';
import { BabelPlainChain, PlainSetter, createBabelPlainChain } from './plain';

export type BabelJSONConfig = {
  plugins: PluginItem[];
  presets: PluginItem[];
};

export type BabelChain = PlainSetter & {
  preset: PresetSetter;
  plugin: PluginSetter;
  merge: (chain: BabelChain) => BabelChain;
  toJSON: () => TransformOptions;
  readonly internal: {
    preset: BabelPresetChain;
    plugin: BabelPluginChain;
    plain: BabelPlainChain;
  };
};

export const createBabelChain = (): BabelChain => {
  const presetChain = createBabelPresetChain();
  const pluginChain = createBabelPluginChain();
  const plainChain = createBabelPlainChain();

  const merge = (other: BabelChain): BabelChain => {
    presetChain.merge(other.internal.preset);
    pluginChain.merge(other.internal.plugin);
    plainChain.merge(other.internal.plain);

    return chain;
  };

  const toJSON = (): BabelJSONConfig => ({
    ...plainChain.toJSON(),
    presets: presetChain.toJSON(),
    plugins: pluginChain.toJSON(),
  });

  const chain: BabelChain = {
    ...plainChain.plain,
    plugin: pluginChain.plugin,
    preset: presetChain.preset,
    toJSON,
    merge,
    get internal() {
      return {
        preset: presetChain,
        plugin: pluginChain,
        plain: plainChain,
      };
    },
  };

  return chain;
};

export const babelChain = createBabelChain();
