import type {
  ArrayOrNot,
  ChainedConfig,
  FileFilterUtil,
  SharedToolsConfig,
  ToolsLessConfig,
  ToolsSassConfig,
  TerserPluginOptions,
} from '@modern-js/builder-shared';
import type {
  ModifyWebpackChainUtils,
  ModifyWebpackConfigUtils,
} from '../hooks';
import type {
  CSSExtractOptions,
  HTMLPluginOptions,
  InspectorPluginOptions,
  TSLoaderOptions,
  WebpackChain,
  WebpackConfig,
} from '../thirdParty';
import type { NormalizedCSSExtractOptions } from '../thirdParty/css';

export type ToolsTerserConfig = ChainedConfig<TerserPluginOptions>;

export type ToolsTSLoaderConfig = ChainedConfig<
  TSLoaderOptions,
  { addIncludes: FileFilterUtil; addExcludes: FileFilterUtil }
>;

export interface StyledComponentOptions {
  pure?: boolean;
  displayName?: boolean;
  ssr?: boolean;
  fileName?: boolean;
  meaninglessFileNames?: string[];
  minify?: boolean;
  transpileTemplateLiterals?: boolean;
  namespace?: string;
  topLevelImportPaths?: string[];
}

export type ToolsStyledComponentConfig = ChainedConfig<StyledComponentOptions>;

export type ToolsCssExtractConfig =
  | CSSExtractOptions
  | ((options: CSSExtractOptions) => CSSExtractOptions | void);

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

export interface ToolsConfig extends SharedToolsConfig {
  /**
  /**
   * Modify the config of [sass-loader](https://github.com/webpack-contrib/sass-loader).
   */
  sass?: ToolsSassConfig;
  /**
   * Modify the config of [less-loader](https://github.com/webpack-contrib/less-loader).
   */
  less?: ToolsLessConfig;
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
   * Modify the options of [html-webpack-plugin](https://github.com/jantimon/html-webpack-plugin).
   */
  htmlPlugin?: false | ToolsHtmlPluginConfig;
  /**
   * Modify the options of [babel-plugin-styled-components](https://github.com/styled-components/babel-plugin-styled-components).
   */
  styledComponents?: false | ToolsStyledComponentConfig;
  /**
   * Modify the options of [mini-css-extract-plugin](https://github.com/webpack-contrib/mini-css-extract-plugin).
   */
  cssExtract?: CSSExtractOptions;
  /**
   * Configure [webpack](https://webpack.js.org/).
   */
  webpack?: ToolsWebpackConfig;
  /**
   * Configure webpack by [webpack-chain](https://github.com/neutrinojs/webpack-chain).
   */
  webpackChain?: ToolsWebpackChainConfig;
  /**
   * Configure the [webpack inspector](https://github.com/web-infra-dev/webpack-inspector).
   */
  inspector?: ToolsInspectorPluginOptions;
}

export interface NormalizedToolsConfig extends ToolsConfig {
  cssExtract: NormalizedCSSExtractOptions;
}
