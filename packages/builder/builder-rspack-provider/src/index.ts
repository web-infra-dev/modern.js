export { getRspackVersion } from './shared/rspackVersion';
export { builderRspackProvider } from './provider';
export type { BuilderRspackProvider } from './provider';

export type {
  // Config Types
  BuilderConfig,
  NormalizedConfig,

  // Hook Callback Types
  ModifyRspackConfigFn,

  // Plugin Types
  BuilderPluginAPI,

  // Rspack
  Rspack,
  RspackConfig,
  Compiler as RspackCompiler,
  MultiCompiler as RspackMultiCompiler,
} from './types';
