import { type UniBuilderInstance, createRspackBuilder } from './rspack';
import type { CreateUniBuilderOptions } from './types';

export type { CreateUniBuilderOptions, UniBuilderInstance };

export type {
  UniBuilderConfig,
  UniBuilderPlugin,
  LooseRsbuildPlugin,
  BundlerType,
  MetaOptions,
  Stats,
  MultiStats,
  RspackConfig,
  CacheGroup,
} from './types';

export async function createUniBuilder(options: CreateUniBuilderOptions) {
  return createRspackBuilder(options);
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
} from '@rsbuild/core';

export {
  RUNTIME_CHUNK_NAME,
  SERVICE_WORKER_ENVIRONMENT_NAME,
  isHtmlDisabled,
  castArray,
} from './shared/utils';

export { parseConfig as parseRspackConfig } from './rspack';
