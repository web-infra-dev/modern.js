import type {
  Syntax,
  Parser,
  Stringifier,
  AcceptedPlugin,
  SourceMapOptions,
} from 'postcss';
import type { PluginOptions } from 'mini-css-extract-plugin';

export interface CSSModulesOptions {
  compileType?: string;
  mode?: string;
  auto?: boolean | RegExp | ((resourcePath: string) => boolean);
  exportGlobals?: boolean;
  localIdentName?: string;
  localIdentContext?: string;
  localIdentHashPrefix?: string;
  namedExport?: boolean;
  exportLocalsConvention?: string;
  exportOnlyLocals?: boolean;
}

export interface CSSLoaderOptions {
  url?: boolean | ((url: string, resourcePath: string) => boolean);
  import?:
    | boolean
    | ((url: string, media: string, resourcePath: string) => boolean);
  modules?: boolean | string | CSSModulesOptions;
  sourceMap?: boolean;
  importLoaders?: number;
  esModule?: boolean;
}

export type StyleLoaderInjectType =
  | 'styleTag'
  | 'singletonStyleTag'
  | 'lazyStyleTag'
  | 'lazySingletonStyleTag'
  | 'linkTag';

export interface StyleLoaderOptions {
  injectType?: StyleLoaderInjectType;
  attributes?: Record<string, string>;
  insert?: string | ((element: HTMLElement) => void);
}

export interface MiniCssExtractLoaderOptions {
  publicPath?: string | ((resourcePath: string, context: string) => string);
  esModule?: boolean;
  modules?: Record<string, unknown>;
}

export interface CssExtractOptions {
  pluginOptions?: PluginOptions;
  loaderOptions?: MiniCssExtractLoaderOptions;
}

export type NormalizedCssExtractOptions = false | Required<CssExtractOptions>;

export type PostCSSOptions = {
  to?: string;
  from?: string;
  map?: boolean | SourceMapOptions;
  syntax?: Syntax;
  parser?: string | object | (() => Parser);
  plugins?: AcceptedPlugin[];
  stringifier?: Stringifier | Syntax;
};

export type PostCSSLoaderOptions = {
  /**
   * Enable PostCSS Parser support in CSS-in-JS. If you use JS styles the postcss-js parser, add the execute option.
   */
  execute?: boolean;
  /**
   * By default generation of source maps depends on the devtool option. All values enable source map generation except eval and false value.
   */
  sourceMap?: boolean;
  /**
   * The special implementation option determines which implementation of PostCSS to use.
   */
  implementation?: unknown;
  /**
   * Allows to set PostCSS options and plugins.
   */
  postcssOptions?: PostCSSOptions;
};

export type { PluginOptions as MiniCSSExtractPluginOptions };

export type { AcceptedPlugin as PostCSSPlugin } from 'postcss';
