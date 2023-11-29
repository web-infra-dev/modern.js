export { getRspackVersion } from './shared/rspackVersion';
export { builderRspackProvider } from './provider';
export type { BuilderRspackProvider } from './provider';

export type {
  // Config Types
  BuilderConfig,
  NormalizedConfig,
  DevConfig,
  OutputConfig,
  ToolsConfig,
  SourceConfig,
  SecurityConfig,
  PerformanceConfig,

  // Hook Callback Types
  ModifyRspackConfigFn,
  ModifyRspackConfigUtils,

  // Plugin Types
  BuilderPluginAPI,

  // Rspack
  Rspack,
  RspackConfig,
  Compiler as RspackCompiler,
  MultiCompiler as RspackMultiCompiler,
} from './types';
