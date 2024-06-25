import { createRspackBuilder, type UniBuilderInstance } from './rspack';
import {
  createWebpackBuilder,
  type UniBuilderWebpackInstance,
} from './webpack';
import type { CreateUniBuilderOptions } from './types';
import HtmlWebpackPlugin from 'html-webpack-plugin';

export { HtmlWebpackPlugin };

export type {
  CreateUniBuilderOptions,
  UniBuilderInstance,
  UniBuilderWebpackInstance,
};
export type {
  RspackChain,
  RsbuildPlugin,
  ConfigChain,
  CopyPluginOptions,
  ChainIdentifier,
  NormalizedConfig,
  RspackConfig,
  CacheGroup,
} from '@rsbuild/shared';
export type { UniBuilderConfig, UniBuilderPlugin } from './types';
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
  type RsbuildConfig,
} from '@rsbuild/core';
export type { webpack, WebpackConfig } from '@rsbuild/webpack';
export { RUNTIME_CHUNK_NAME } from './shared/utils';
