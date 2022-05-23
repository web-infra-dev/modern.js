import type { PluginItem } from '@babel/core';

export type Preset = {
  name: string;
  path?: string;
  options: any[];
};

export type PresetSetter = (name: string) => {
  tap: (options: any[]) => void;
  delete: () => void;
  ban: () => void;
  filter: Preset[]['filter'];
  options: () => any[];
  use: (path: string, options?: any[]) => void;
};

export type BabelPresetChain = {
  preset: PresetSetter;
  presets: Preset[];
  blacks: string[];
  toJSON: () => PluginItem[];
  merge: (other: BabelPresetChain) => BabelPresetChain;
};

export const createBabelPresetChain = (): BabelPresetChain => {
  let presets: Preset[] = [];

  const blacks: string[] = [];

  const preset = (name: string) => {
    const presetExist = presets.find(plugin => plugin.name === name);
    const isExist = Boolean(presetExist);
    const preset: Preset = presetExist || { name, options: [] };

    const tap = (options: any[]) => {
      preset.options = options;
      set();
    };

    const options = (): any[] => preset.options;

    const del = () => {
      if (isExist) {
        presets = presets.filter(preset => !preset.name.includes(name));
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
        throw new Error(`Preset: ${name} has been banned!, You can't set it.`);
      }

      // merge preset with replacing
      // see https://babeljs.io/docs/en/configuration#how-babel-merges-config-items
      if (!isExist) {
        presets.push(preset);
      }
    };

    const use = (path: string, options?: any[]) => {
      preset.path = path;
      preset.options = options || [];
      set();
    };

    return {
      tap,
      delete: del,
      ban,
      options,
      filter: presets.filter,
      use,
    };
  };

  const toJSON = (): PluginItem[] =>
    presets.map(preset =>
      preset.options
        ? [preset.path || preset.name, ...preset.options]
        : preset.path || preset.name,
    );

  // merge preset with replacing
  // see https://babeljs.io/docs/en/configuration#how-babel-merges-config-items
  const merge = (other: BabelPresetChain): BabelPresetChain => {
    for (const preset of other.presets) {
      if (preset.path) {
        chain.preset(preset.name).use(preset.path, preset.options);
      } else {
        chain.preset(preset.name).tap(preset.options);
      }
    }

    return chain;
  };

  const chain = {
    preset,
    presets,
    blacks,
    toJSON,
    merge,
  };

  return chain;
};
