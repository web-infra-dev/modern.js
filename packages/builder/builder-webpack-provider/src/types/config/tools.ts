import type { DevServerOptions } from '@modern-js/types';
import type { IStyledComponentOptions } from '@modern-js/babel-preset-app';
import type {
  PugOptions,
  WebpackChain,
  WebpackConfig,
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
  InspectorPluginOptions,
} from '../thirdParty';
import type { ArrayOrNot, ChainedConfig } from '@modern-js/builder-shared';
import type { ModifyWebpackUtils } from '../hooks';

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
  tsChecker?: false | ToolsTSCheckerConfig;
  devServer?: ToolsDevServerConfig;
  minifyCss?: ToolsMinifyCssConfig;
  htmlPlugin?: false | ToolsHtmlPluginConfig;
  styledComponents?: ToolsStyledComponentConfig;
  cssLoader?: ToolsCSSLoaderConfig;
  styleLoader?: ToolsStyleLoaderConfig;
  cssExtract?: CssExtractOptions;
  postcss?: ToolsPostCSSLoaderConfig;
  autoprefixer?: ToolsAutoprefixerConfig;
  webpack?: ToolsWebpackConfig;
  webpackChain?: ToolsWebpackChainConfig;
  inspector?: ToolsInspectorPluginOptions;
}
