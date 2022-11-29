export type {
  TransformOptions as BabelTransformOptions,
  PluginItem as BabelPlugin,
} from '@babel/core';

export type InternalPlugins = Record<
  string,
  string | { path: string; forced?: boolean }
>;
