import { createRspackBuilder } from './rspack';
import { createWebpackBuilder } from './webpack';
import type { CreateUniBuilderOptions } from './types';

export type { CreateUniBuilderOptions };
export type {
  BundlerChain,
  RsbuildPlugin,
  ChainedConfig,
  CopyPluginOptions,
} from '@rsbuild/shared';
export type { BuilderConfig } from './types';
export type { StartDevServerOptions } from './shared/devServer';

export async function createUniBuilder(options: CreateUniBuilderOptions) {
  return options.bundlerType === 'rspack'
    ? createRspackBuilder(options)
    : createWebpackBuilder(options);
}

export { logger, type Rspack } from '@rsbuild/core';
export { type webpack } from '@rsbuild/webpack';
export { RUNTIME_CHUNK_NAME } from './shared/constants';
