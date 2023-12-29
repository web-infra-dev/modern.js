import { createRspackBuilder, type UniBuilderInstance } from './rspack';
import { createWebpackBuilder, UniBuilderWebpackInstance } from './webpack';
import type { CreateUniBuilderOptions } from './types';
import HtmlWebpackPlugin from 'html-webpack-plugin';

export { HtmlWebpackPlugin };

export type {
  CreateUniBuilderOptions,
  UniBuilderInstance,
  UniBuilderWebpackInstance,
};
export type {
  BundlerChain,
  RsbuildPlugin,
  ChainedConfig,
  CopyPluginOptions,
  ChainIdentifier,
  NormalizedConfig,
  RspackConfig,
} from '@rsbuild/shared';
export type { BuilderConfig } from './types';
export type { StartDevServerOptions } from './shared/devServer';

export async function createUniBuilder(options: CreateUniBuilderOptions) {
  return options.bundlerType === 'rspack'
    ? createRspackBuilder(options)
    : createWebpackBuilder(options);
}

export {
  logger,
  type Rspack,
  type RsbuildContext,
  RsbuildConfig,
} from '@rsbuild/core';
export type { webpack, WebpackChain, WebpackConfig } from '@rsbuild/webpack';
export { RUNTIME_CHUNK_NAME } from './shared/constants';
