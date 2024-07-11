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
  UniBuilderConfig,
  UniBuilderPlugin,
  BundlerType,
  MetaOptions,
  Stats,
  MultiStats,
  RspackConfig,
} from './types';
export type { StartDevServerOptions } from './shared/devServer';

export async function createUniBuilder(options: CreateUniBuilderOptions) {
  return options.bundlerType === 'rspack'
    ? createRspackBuilder(options)
    : createWebpackBuilder(options);
}

export {
  logger,
  type ConfigChain,
  type RsbuildPlugin,
  type ChainIdentifier,
  type RspackChain,
  type Rspack,
  type RsbuildContext,
  type RsbuildConfig,
  type RsbuildTarget,
  type NormalizedConfig,
  type CacheGroup,
} from '@rsbuild/core';
export type { webpack, WebpackConfig } from '@rsbuild/webpack';
export { RUNTIME_CHUNK_NAME, isHtmlDisabled, castArray } from './shared/utils';
