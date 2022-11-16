import type { IStyledComponentOptions } from '@modern-js/babel-preset-app';
import type { ArrayOrNot, ChainedConfig } from '@modern-js/builder-shared';
import type { DevServerOptions } from '@modern-js/types';
import type {
  ModifyWebpackChainUtils,
  ModifyWebpackConfigUtils,
} from '../hooks';
import type {
  AutoprefixerOptions,
  BabelConfigUtils,
  BabelTransformOptions,
  CSSExtractOptions,
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
import type { NormalizedCSSExtractOptions } from '../thirdParty/css';

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
  | CSSExtractOptions
  | ((options: CSSExtractOptions) => CSSExtractOptions | void);

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
  ModifyWebpackConfigUtils
>;

export type ToolsWebpackChainConfig = ArrayOrNot<
  (chain: WebpackChain, utils: ModifyWebpackChainUtils) => void
>;

export type ToolsDevServerConfig = ChainedConfig<DevServerOptions>;

export interface ToolsConfig {
  /**
   * Configure the [Pug](https://pugjs.org/) template engine.
   */
  pug?: ToolsPugConfig;
  /**
   * Modify the config of [sass-loader](https://github.com/webpack-contrib/sass-loader).
   */
  sass?: ToolsSassConfig;
  /**
   * Modify the config of [less-loader](https://github.com/webpack-contrib/less-loader).
   */
  less?: ToolsLessConfig;
  /**
   * Modify the options of [babel-loader](https://github.com/babel/babel-loader)
   */
  babel?: ToolsBabelConfig;
  /**
   * Modify the options of [terser-webpack-plugin](https://github.com/webpack-contrib/terser-webpack-plugin).
   */
  terser?: ToolsTerserConfig;
  /**
   * Modify the options of [ts-loader](https://github.com/TypeStrong/ts-loader).
   * When `tools.tsLoader` is not undefined, builder will use ts-loader instead of babel-loader to compile TypeScript code.
   */
  tsLoader?: ToolsTSLoaderConfig;
  /**
   * Modify the options of [fork-ts-checker-webpack-plugin](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin).
   */
  tsChecker?: boolean | ToolsTSCheckerConfig;
  /**
   * Modify the options of DevServer.
   */
  devServer?: ToolsDevServerConfig;
  /**
   * Modify the options of [css-minimizer-webpack-plugin](https://github.com/webpack-contrib/css-minimizer-webpack-plugin).
   */
  minifyCss?: ToolsMinifyCssConfig;
  /**
   * Modify the options of [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin).
   */
  htmlPlugin?: false | ToolsHtmlPluginConfig;
  /**
   * Modify the options of [babel-plugin-styled-components](https://github.com/styled-components/babel-plugin-styled-components).
   */
  styledComponents?: ToolsStyledComponentConfig;
  /**
   * Modify the options of [css-loader](https://github.com/webpack-contrib/css-loader).
   */
  cssLoader?: ToolsCSSLoaderConfig;
  /**
   * Modify the options of [style-loader](https://github.com/webpack-contrib/style-loader).
   */
  styleLoader?: ToolsStyleLoaderConfig;
  /**
   * Modify the options of [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin).
   */
  cssExtract?: false | CSSExtractOptions;
  /**
   * Modify the options of [postcss-loader](https://github.com/webpack-contrib/postcss-loader).
   */
  postcss?: ToolsPostCSSLoaderConfig;
  /**
   * Modify the config of [autoprefixer](https://github.com/postcss/autoprefixer)
   */
  autoprefixer?: ToolsAutoprefixerConfig;
  /**
   * Configure [webpack](https://webpack.js.org/).
   */
  webpack?: ToolsWebpackConfig;
  /**
   * Configure webpack by [webpack-chain](https://github.com/neutrinojs/webpack-chain).
   */
  webpackChain?: ToolsWebpackChainConfig;
  /**
   * Configure the [webpack inspector](https://github.com/modern-js-dev/webpack-inspector).
   */
  inspector?: ToolsInspectorPluginOptions;
}

export interface NormalizedToolsConfig extends ToolsConfig {
  cssExtract: NormalizedCSSExtractOptions;
}
