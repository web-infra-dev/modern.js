import type WebpackChain from '@modern-js/utils/webpack-chain';
import type webpack from 'webpack';
import type { Configuration as WebpackConfig } from 'webpack';
import type TerserPlugin from 'terser-webpack-plugin';
import type CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

export type { CopyPluginOptions } from './CopyWebpackPlugin';

export type TerserPluginOptions = TerserPlugin.BasePluginOptions &
  TerserPlugin.DefinedDefaultMinimizerAndOptions<TerserPlugin.TerserOptions>;

export type CssMinimizerPluginOptions = CssMinimizerPlugin.BasePluginOptions &
  CssMinimizerPlugin.DefinedDefaultMinimizerAndOptions<CssMinimizerPlugin.CssNanoOptionsExtended>;

export type { webpack, WebpackChain, WebpackConfig };
