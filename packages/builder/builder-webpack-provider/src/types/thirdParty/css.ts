import type {
  Syntax,
  Parser,
  Stringifier,
  AcceptedPlugin,
  SourceMapOptions,
} from 'postcss';

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

export interface MiniCSSExtractLoaderOptions {
  /**
   * Overrides [`output.publicPath`](https://webpack.js.org/configuration/output/#outputpublicpath).
   * @default output.publicPath
   */
  publicPath?: string | ((resourcePath: string, context: string) => string);
  /**
   * If false, the plugin will extract the CSS but **will not** emit the file
   * @default true
   */
  emit?: boolean | undefined;
  /**
   * By default, `mini-css-extract-plugin` generates JS modules that use the ES modules syntax.
   * There are some cases in which using ES modules is beneficial,
   * like in the case of module concatenation and tree shaking.
   * @default true
   */
  esModule?: boolean;
}

export interface MiniCSSExtractPluginOptions {
  /**
   * This option determines the name of each output CSS file.
   * @link https://github.com/webpack-contrib/mini-css-extract-plugin#filename
   * @default '[name].css'
   */
  filename?: string | undefined;
  /**
   * This option determines the name of non-entry chunk files.
   * @link https://github.com/webpack-contrib/mini-css-extract-plugin#chunkfilename
   */
  chunkFilename?: string | undefined;
  /**
   * Remove Order Warnings.
   * @link https://github.com/webpack-contrib/mini-css-extract-plugin#ignoreorder
   * @default false
   */
  ignoreOrder?: boolean | undefined;
  /**
   * Inserts `<link>` at the given position.
   * @link https://github.com/webpack-contrib/mini-css-extract-plugin#insert
   * @default document.head.appendChild(linkTag)
   */
  insert?: string | ((linkTag: any) => void) | undefined;
  /**
   * Adds custom attributes to tag.
   * @link https://github.com/webpack-contrib/mini-css-extract-plugin#attributes
   * @default {}
   */
  attributes?: Record<string, string> | undefined;
  /**
   * This option allows loading asynchronous chunks with a custom link type
   * @link https://github.com/webpack-contrib/mini-css-extract-plugin#linktype
   * @default 'text/css'
   */
  linkType?: string | false | 'text/css' | undefined;
}

export interface CSSExtractOptions {
  pluginOptions?: MiniCSSExtractPluginOptions;
  loaderOptions?: MiniCSSExtractLoaderOptions;
}

export type NormalizedCSSExtractOptions = false | Required<CSSExtractOptions>;

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

export type { AcceptedPlugin as PostCSSPlugin } from 'postcss';
