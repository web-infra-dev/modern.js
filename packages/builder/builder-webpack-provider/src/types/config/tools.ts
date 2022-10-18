import type { IStyledComponentOptions } from '@modern-js/babel-preset-app';
import type { ArrayOrNot, ChainedConfig } from '@modern-js/builder-shared';
import type { DevServerOptions } from '@modern-js/types';
import type { ModifyWebpackUtils } from '../hooks';
import type {
  AutoprefixerOptions,
  BabelConfigUtils,
  BabelTransformOptions,
  CssExtractOptions,
  CSSLoaderOptions,
  CssMinimizerPluginOptions,
  ForkTSCheckerOptions,
  HTMLPluginOptions,
  InspectorPluginOptions,
  LessLoaderOptions,
  PostCSSLoaderOptions,
  PostCSSPlugin,
  PugOptions,
  SassLoaderOptions,
  StyleLoaderOptions,
  TerserPluginOptions,
  TSLoaderOptions,
  WebpackChain,
  WebpackConfig,
} from '../thirdParty';
import type { NormalizedCssExtractOptions } from '../thirdParty/css';

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

export type ToolsPugConfig = true | ChainedConfig<PugOptions>;

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
    entryValue: WebpackConfig['entry'];
  }
>;

export type ToolsInspectorPluginOptions = ChainedConfig<InspectorPluginOptions>;

export type ToolsWebpackConfig = ChainedConfig<
  WebpackConfig,
  ModifyWebpackUtils
>;

export type ToolsWebpackChainConfig = ArrayOrNot<
  (chain: WebpackChain, utils: ModifyWebpackUtils) => void
>;

export type ToolsDevServerConfig = ChainedConfig<DevServerOptions>;

export interface ToolsConfig {
  pug?: ToolsPugConfig;
  sass?: ToolsSassConfig;
  less?: ToolsLessConfig;
  babel?: ToolsBabelConfig;
  terser?: ToolsTerserConfig;
  tsLoader?: ToolsTSLoaderConfig;
  tsChecker?: boolean | ToolsTSCheckerConfig;
  devServer?: ToolsDevServerConfig;
  minifyCss?: ToolsMinifyCssConfig;
  htmlPlugin?: false | ToolsHtmlPluginConfig;
  styledComponents?: ToolsStyledComponentConfig;
  cssLoader?: ToolsCSSLoaderConfig;
  styleLoader?: ToolsStyleLoaderConfig;
  cssExtract?: false | CssExtractOptions;
  postcss?: ToolsPostCSSLoaderConfig;
  autoprefixer?: ToolsAutoprefixerConfig;
  webpack?: ToolsWebpackConfig;
  webpackChain?: ToolsWebpackChainConfig;
  inspector?: ToolsInspectorPluginOptions;
}

export interface NormalizedToolsConfig extends ToolsConfig {
  cssExtract: NormalizedCssExtractOptions;
}
