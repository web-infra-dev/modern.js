import type {
  PluginItem as BabelPlugin,
  TransformOptions as BabelTransformOptions,
} from '@babel/core';

export type {
  TransformOptions as BabelTransformOptions,
  PluginItem as BabelPlugin,
  PluginOptions as BabelPluginOptions,
} from '@babel/core';

export type PresetEnvOptions = Partial<{
  targets:
    | string
    | string[]
    | Record<string, string>
    | Partial<{
        esmodules: boolean;
        node: string | 'current';
        safari: string | 'tp';
        browsers: string[];
      }>;
  bugfixes: boolean;
  spec: boolean;
  loose: boolean;
  modules: 'amd' | 'umd' | 'systemjs' | 'commonjs' | 'cjs' | 'auto' | false;
  debug: boolean;
  include: string[];
  exclude: string[];
  useBuiltIns: 'usage' | 'entry' | false;
  corejs: string | { version: string; proposals: boolean };
  forceAllTransforms: boolean;
  configPath: string;
  ignoreBrowserslistConfig: boolean;
  browserslistEnv: string;
  shippedProposals: boolean;
}>;

export interface SharedBabelPresetReactOptions {
  development?: boolean;
  throwIfNamespace?: boolean;
}

export interface AutomaticRuntimePresetReactOptions
  extends SharedBabelPresetReactOptions {
  runtime?: 'automatic';
  importSource?: string;
}

export interface ClassicRuntimePresetReactOptions
  extends SharedBabelPresetReactOptions {
  runtime?: 'classic';
  pragma?: string;
  pragmaFrag?: string;
  useBuiltIns?: boolean;
  useSpread?: boolean;
}

export type PresetReactOptions =
  | AutomaticRuntimePresetReactOptions
  | ClassicRuntimePresetReactOptions;

export type BabelConfigUtils = {
  addPlugins: (plugins: BabelPlugin[]) => void;
  addPresets: (presets: BabelPlugin[]) => void;
  addIncludes: (includes: string | RegExp | (string | RegExp)[]) => void;
  addExcludes: (excludes: string | RegExp | (string | RegExp)[]) => void;
  removePlugins: (plugins: string | string[]) => void;
  removePresets: (presets: string | string[]) => void;
  modifyPresetEnvOptions: (options: PresetEnvOptions) => void;
  modifyPresetReactOptions: (options: PresetReactOptions) => void;
};
export type BabelConfig =
  | BabelTransformOptions
  | ((
      config: BabelTransformOptions,
      utils: BabelConfigUtils,
    ) => BabelTransformOptions | void);

export type BabelOptions = BabelTransformOptions;
