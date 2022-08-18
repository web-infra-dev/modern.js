import type WebpackChain from '@modern-js/utils/webpack-chain';
import type webpack from 'webpack';
import type { Configuration as WebpackConfig, LoaderContext } from 'webpack';
import type TerserPlugin from 'terser-webpack-plugin';
import type CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import type ForkTSCheckerPlugin from 'fork-ts-checker-webpack-plugin';
import type { Options as RawTSLoaderOptions } from 'ts-loader';
import type * as sassLoader from 'sass-loader';
import type Less from 'less';

export type { CopyPluginOptions } from './CopyWebpackPlugin';
export type { Options as HTMLPluginOptions } from 'html-webpack-plugin';

export type TerserPluginOptions = TerserPlugin.BasePluginOptions &
  TerserPlugin.DefinedDefaultMinimizerAndOptions<TerserPlugin.TerserOptions>;

export type CssMinimizerPluginOptions = CssMinimizerPlugin.BasePluginOptions &
  CssMinimizerPlugin.DefinedDefaultMinimizerAndOptions<CssMinimizerPlugin.CssNanoOptionsExtended>;

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
  CssExtractOptions,
  PostCSSLoaderOptions,
  PostCSSPlugin,
  MiniCSSExtractPluginOptions,
  MiniCssExtractLoaderOptions,
} from './css';

export type { Options as AutoprefixerOptions } from 'autoprefixer';

export type SassLoaderOptions = sassLoader.Options;

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
  implementation?: boolean;
};
