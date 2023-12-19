import { createRspackBuilder } from './rspack';
import { createWebpackBuilder } from './webpack';
import type { CreateUniBuilderOptions } from './types';

export async function createUniBuilder(options: CreateUniBuilderOptions) {
  return options.bundlerType === 'rspack'
    ? createRspackBuilder(options)
    : createWebpackBuilder(options);
}

export type { CreateUniBuilderOptions };
export type { BundlerChain } from '@rsbuild/shared';
export { logger } from '@rsbuild/core';
export type { BuilderConfig } from './types';

export { RUNTIME_CHUNK_NAME } from './shared/constants';
