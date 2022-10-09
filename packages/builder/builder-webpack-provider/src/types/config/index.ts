<<<<<<< HEAD
import type { DevConfig, NormalizedDevConfig } from './dev';
import type {
  ExperimentsConfig,
  NormalizedExperimentsConfig,
} from './experiments';
import type { HtmlConfig, NormalizedHtmlConfig } from './html';
import type { NormalizedOutputConfig, OutputConfig } from './output';
import type {
  NormalizedPerformanceConfig,
  PerformanceConfig,
} from './performance';
import type { NormalizedSecurityConfig, SecurityConfig } from './security';
import type { NormalizedSourceConfig, SourceConfig } from './source';
import type { NormalizedToolsConfig, ToolsConfig } from './tools';
=======
import type { DevConfig } from './dev';
import type { HtmlConfig } from './html';
import type { ToolsConfig } from './tools';
import type { SourceConfig } from './source';
import type { OutputConfig } from './output';
import type { SecurityConfig } from './security';
import type { PerformanceConfig } from './performance';
import type { ExperimentsConfig } from './experiments';
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))

export interface BuilderConfig {
  dev?: DevConfig;
  html?: HtmlConfig;
  tools?: ToolsConfig;
  source?: SourceConfig;
  output?: OutputConfig;
  security?: SecurityConfig;
  performance?: PerformanceConfig;
  experiments?: ExperimentsConfig;
}

<<<<<<< HEAD
export interface NormalizedConfig extends Required<BuilderConfig> {
  dev: NormalizedDevConfig;
  html: NormalizedHtmlConfig;
  tools: NormalizedToolsConfig;
  source: NormalizedSourceConfig;
  output: NormalizedOutputConfig;
  security: NormalizedSecurityConfig;
  performance: NormalizedPerformanceConfig;
  experiments: NormalizedExperimentsConfig;
}

/* eslint-disable @typescript-eslint/no-restricted-imports */
export * from './dev';
export * from './experiments';
export * from './html';
export * from './output';
export * from './performance';
export * from './security';
export * from './source';
export * from './tools';
=======
/* eslint-disable @typescript-eslint/no-restricted-imports */
export * from './dev';
export * from './html';
export * from './tools';
export * from './source';
export * from './output';
export * from './security';
export * from './performance';
export * from './experiments';
>>>>>>> ac5486156 (refactor(builder): split builder and provider (#1804))
/* eslint-enable @typescript-eslint/no-restricted-imports */
