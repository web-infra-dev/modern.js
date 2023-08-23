import type WebpackChain from '@modern-js/utils/webpack-chain';
import type webpack from 'webpack';
import type {
  Configuration as WebpackConfig,
  Compiler as WebpackCompiler,
  MultiCompiler as WebpackMultiCompiler,
} from 'webpack';
import type { Options as RawTSLoaderOptions } from 'ts-loader';

export type { BabelTransformOptions, BabelConfigUtils } from '@modern-js/types';
export type { InspectorPluginOptions } from '@modern-js/inspector-webpack-plugin';
export type { CopyPluginOptions } from './CopyWebpackPlugin';
export type { Options as HTMLPluginOptions } from 'html-webpack-plugin';
export type { SubresourceIntegrityPluginOptions as SubresourceIntegrityOptions } from 'webpack-subresource-integrity';

export type TSLoaderOptions = Partial<RawTSLoaderOptions>;

export type {
  webpack,
  WebpackChain,
  WebpackConfig,
  WebpackCompiler,
  WebpackMultiCompiler,
};

export type {
  CSSExtractOptions,
  MiniCSSExtractPluginOptions,
  MiniCSSExtractLoaderOptions,
} from './css';
