import type { IStyledComponentOptions } from '@modern-js/babel-preset-app';
import type {
  TSLoaderOptions,
  BabelConfigUtils,
  TerserPluginOptions,
  ForkTSCheckerOptions,
  BabelTransformOptions,
  CssMinimizerPluginOptions,
  CSSLoaderOptions,
  StyleLoaderOptions,
  CssExtractOptions,
  AutoprefixerOptions,
  PostCSSLoaderOptions,
  PostCSSPlugin,
  LessLoaderOptions,
  SassLoaderOptions,
  HTMLPluginOptions,
} from '../thirdParty';
import type { ChainedConfig } from '../utils';

export type ToolsTerserConfig = ChainedConfig<TerserPluginOptions>;

export type ToolsMinifyCssConfig = ChainedConfig<CssMinimizerPluginOptions>;

export type ToolsBabelConfig = ChainedConfig<
  BabelTransformOptions,
  BabelConfigUtils
>;

export type ToolsTSLoaderConfig = ChainedConfig<
  TSLoaderOptions,
  {
    addIncludes: (items: string | RegExp | (string | RegExp)[]) => void;
    addExcludes: (items: string | RegExp | (string | RegExp)[]) => void;
  }
>;

export type ToolsStyledComponentConfig = ChainedConfig<IStyledComponentOptions>;

export type ToolsCSSLoaderConfig = ChainedConfig<CSSLoaderOptions>;

export type ToolsStyleLoaderConfig = ChainedConfig<StyleLoaderOptions>;

export type ToolsCssExtractConfig =
  | CssExtractOptions
  | ((options: CssExtractOptions) => CssExtractOptions | void);

export type ToolsAutoprefixerConfig = ChainedConfig<AutoprefixerOptions>;

export type ToolsPostCSSLoaderConfig = ChainedConfig<
  PostCSSLoaderOptions,
  {
    addPlugins: (plugins: PostCSSPlugin | PostCSSPlugin[]) => void;
  }
>;

export type ToolsLessConfig = ChainedConfig<
  LessLoaderOptions,
  { addExcludes: (excludes: RegExp | RegExp[]) => void }
>;

export type ToolsSassConfig = ChainedConfig<
  SassLoaderOptions,
  { addExcludes: (excludes: RegExp | RegExp[]) => void }
>;

export type ToolsTSCheckerConfig = ChainedConfig<ForkTSCheckerOptions>;

export type ToolsHtmlPluginConfig = ChainedConfig<
  HTMLPluginOptions,
  {
    entryName: string;
    entryValue: string[];
  }
>;

export type DevServerConfig = {
  hot?: boolean;
};

export interface ToolsConfig {
  sass?: ToolsSassConfig;
  less?: ToolsLessConfig;
  babel?: ToolsBabelConfig;
  terser?: ToolsTerserConfig;
  tsLoader?: ToolsTSLoaderConfig;
  tsChecker?: false | ToolsTSCheckerConfig;
  devServer?: DevServerConfig;
  minifyCss?: ToolsMinifyCssConfig;
  htmlPlugin?: ToolsHtmlPluginConfig;
  styledComponents?: ToolsStyledComponentConfig;
  cssLoader?: ToolsCSSLoaderConfig;
  styleLoader?: ToolsStyleLoaderConfig;
  cssExtract?: CssExtractOptions;
  postcss?: ToolsPostCSSLoaderConfig;
  autoprefixer?: ToolsAutoprefixerConfig;
}
