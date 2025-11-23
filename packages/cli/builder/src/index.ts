import { type BuilderInstance, createRspackBuilder } from './createBuilder';
import type { CreateBuilderOptions } from './types';

export type { CreateBuilderOptions, BuilderInstance };

export type {
  BuilderConfig,
  BundlerType,
  ToolsDevServerConfig,
  MetaOptions,
  Stats,
  MultiStats,
  RspackConfig,
  CacheGroup,
} from './types';

export { createRspackBuilder as createBuilder };

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
  RUNTIME_CHUNK_REGEX,
  SERVICE_WORKER_ENVIRONMENT_NAME,
  isHtmlDisabled,
  castArray,
} from './shared/utils';

export { parseConfig as parseRspackConfig } from './createBuilder';
