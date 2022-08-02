import type {
  TerserPluginOptions,
  CssMinimizerPluginOptions,
} from '../dependencies';

export type ToolsTerserConfig =
  | TerserPluginOptions
  | ((options: TerserPluginOptions) => TerserPluginOptions | void);

export type ToolsMinifyCssConfig =
  | CssMinimizerPluginOptions
  | ((options: CssMinimizerPluginOptions) => CssMinimizerPluginOptions | void);

export interface WebBuilderToolsConfig {
  terser?: ToolsTerserConfig;
  minifyCss?: ToolsMinifyCssConfig;
}
