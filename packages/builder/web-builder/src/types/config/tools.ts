import { IStyledComponentOptions } from '@modern-js/babel-preset-app';
import type {
  TerserPluginOptions,
  CssMinimizerPluginOptions,
  BabelTransformOptions,
  TSLoaderOptions,
  ForkTSCheck,
  BabelConfigUtils,
} from '../thirdParty';

export type ToolsTerserConfig =
  | TerserPluginOptions
  | ((options: TerserPluginOptions) => TerserPluginOptions | void);

export type ToolsMinifyCssConfig =
  | CssMinimizerPluginOptions
  | ((options: CssMinimizerPluginOptions) => CssMinimizerPluginOptions | void);

export type ToolsBabelConfig =
  | BabelTransformOptions
  | ((
      options: BabelTransformOptions,
      utils: BabelConfigUtils,
    ) => BabelTransformOptions);

export interface ToolsConfig {
  terser?: ToolsTerserConfig;
  minifyCss?: ToolsMinifyCssConfig;
  babel?: ToolsBabelConfig;
  tsLoader?: TSLoaderOptions;
  tsCheck?: ForkTSCheck;
  styledComponents?: IStyledComponentOptions;
}
