import type WebpackChain from '@modern-js/builder-shared/webpack-5-chain';
import type webpack from 'webpack';
import type { Configuration as WebpackConfig } from 'webpack';
import type TerserPlugin from 'terser-webpack-plugin';
import type CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import type { Options as RawTSLoaderOptions } from 'ts-loader';

export type { BabelTransformOptions } from '@modern-js/types';
export type { InspectorPluginOptions } from '@modern-js/inspector-webpack-plugin';
export type { CopyPluginOptions } from './CopyWebpackPlugin';
export type { Options as HTMLPluginOptions } from 'html-webpack-plugin';
export type { SubresourceIntegrityPluginOptions as SubresourceIntegrityOptions } from '../../../compiled/webpack-subresource-integrity';

export type TerserPluginOptions = TerserPlugin.BasePluginOptions &
  TerserPlugin.DefinedDefaultMinimizerAndOptions<TerserPlugin.TerserOptions>;

export type CssMinimizerPluginOptions = CssMinimizerPlugin.BasePluginOptions &
  CssMinimizerPlugin.DefinedDefaultMinimizerAndOptions<CssMinimizerPlugin.CssNanoOptionsExtended>;

export type { CssNanoOptions } from 'css-minimizer-webpack-plugin';

export type { BabelConfigUtils } from '@modern-js/babel-preset-app';

export type TSLoaderOptions = Partial<RawTSLoaderOptions>;

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
