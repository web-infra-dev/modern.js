import type {
  Options as SassOptions,
  LegacyOptions as LegacySassOptions,
} from '../../compiled/sass';
import type * as SassLoader from '../../compiled/sass-loader';
import type Less from '../../compiled/less';
import type { LoaderContext } from 'webpack';
import type TerserPlugin from 'terser-webpack-plugin';
import type ForkTSCheckerPlugin from 'fork-ts-checker-webpack-plugin';
import type {
  Syntax,
  Parser,
  Stringifier,
  AcceptedPlugin,
  SourceMapOptions,
} from 'postcss';
import type CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

export type CssMinimizerPluginOptions = CssMinimizerPlugin.BasePluginOptions &
  CssMinimizerPlugin.DefinedDefaultMinimizerAndOptions<CssMinimizerPlugin.CssNanoOptionsExtended>;

export type TerserPluginOptions = TerserPlugin.BasePluginOptions &
  TerserPlugin.DefinedDefaultMinimizerAndOptions<TerserPlugin.TerserOptions>;

export type { Options as PugOptions } from '../../compiled/pug';

export type AutoprefixerOptions = {
  /** environment for `Browserslist` */
  env?: string;

  /** should Autoprefixer use Visual Cascade, if CSS is uncompressed */
  cascade?: boolean;

  /** should Autoprefixer add prefixes. */
  add?: boolean;

  /** should Autoprefixer [remove outdated] prefixes */
  remove?: boolean;

  /** should Autoprefixer add prefixes for @supports parameters. */
  supports?: boolean;

  /** should Autoprefixer add prefixes for flexbox properties */
  flexbox?: boolean | 'no-2009';

  /** should Autoprefixer add IE 10-11 prefixes for Grid Layout properties */
  grid?: boolean | 'autoplace' | 'no-autoplace';

  /**
   * list of queries for target browsers.
   * Try to not use it.
   * The best practice is to use `.browserslistrc` config or `browserslist` key in `package.json`
   * to share target browsers with Babel, ESLint and Stylelint
   */
  overrideBrowserslist?: string | string[];

  /** do not raise error on unknown browser version in `Browserslist` config. */
  ignoreUnknownVersions?: boolean;
};

export type SassLoaderOptions = Omit<SassLoader.Options, 'sassOptions'> &
  (
    | {
        api?: 'legacy';
        sassOptions?: Partial<LegacySassOptions<'async'>>;
      }
    | {
        api: 'modern';
        sassOptions?: SassOptions<'async'>;
      }
  );

export type LessLoaderOptions = {
  lessOptions?: Less.Options;
  additionalData?:
    | string
    | ((
        content: string,
        loaderContext: LoaderContext<LessLoaderOptions>,
      ) => string);
  sourceMap?: boolean;
  webpackImporter?: boolean;
  implementation?: unknown;
};

export type ForkTSCheckerOptions = ConstructorParameters<
  typeof ForkTSCheckerPlugin
>[0];

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
