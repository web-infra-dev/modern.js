import type WebpackChain from '../../../compiled/webpack-5-chain';
import type webpack from 'webpack';
import type { Configuration as WebpackConfig, LoaderContext } from 'webpack';
import type TerserPlugin from 'terser-webpack-plugin';
import type CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import type ForkTSCheckerPlugin from 'fork-ts-checker-webpack-plugin';
import type { Options as RawTSLoaderOptions } from 'ts-loader';
import type { Options as SassOptions } from '../../../compiled/sass';
import type * as SassLoader from '../../../compiled/sass-loader';
import type Less from '../../../compiled/less';

export type { InspectorPluginOptions } from '@modern-js/inspector-webpack-plugin';
export type { CopyPluginOptions } from './CopyWebpackPlugin';
export type { Options as HTMLPluginOptions } from 'html-webpack-plugin';
export type { Options as PugOptions } from '../../../compiled/pug';
export type { SubresourceIntegrityPluginOptions as SubresourceIntegrityOptions } from '../../../compiled/webpack-subresource-integrity';

export type TerserPluginOptions = TerserPlugin.BasePluginOptions &
  TerserPlugin.DefinedDefaultMinimizerAndOptions<TerserPlugin.TerserOptions>;

export type CssMinimizerPluginOptions = CssMinimizerPlugin.BasePluginOptions &
  CssMinimizerPlugin.DefinedDefaultMinimizerAndOptions<CssMinimizerPlugin.CssNanoOptionsExtended>;

export type { CssNanoOptions } from 'css-minimizer-webpack-plugin';

export type { BabelConfigUtils } from '@modern-js/babel-preset-app';

export type { TransformOptions as BabelTransformOptions } from '@babel/core';

export type TSLoaderOptions = Partial<RawTSLoaderOptions>;

export type ForkTSCheckerOptions = ConstructorParameters<
  typeof ForkTSCheckerPlugin
>[0];

export type { webpack, WebpackChain, WebpackConfig };

export type {
  CSSLoaderOptions,
  StyleLoaderOptions,
  CSSExtractOptions,
  PostCSSLoaderOptions,
  PostCSSPlugin,
  MiniCSSExtractPluginOptions,
  MiniCSSExtractLoaderOptions,
} from './css';

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

export type SassLoaderOptions = Omit<SassLoader.Options, 'sassOptions'> & {
  sassOptions?: SassOptions<'sync'>;
};

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
