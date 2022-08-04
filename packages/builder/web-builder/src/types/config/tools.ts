import type {
  TerserPluginOptions,
  CssMinimizerPluginOptions,
} from '../thirdParty';

export type ToolsTerserConfig =
  | TerserPluginOptions
  | ((options: TerserPluginOptions) => TerserPluginOptions | void);

export type ToolsMinifyCssConfig =
  | CssMinimizerPluginOptions
  | ((options: CssMinimizerPluginOptions) => CssMinimizerPluginOptions | void);

export interface ToolsConfig {
  terser?: ToolsTerserConfig;
  minifyCss?: ToolsMinifyCssConfig;
}
