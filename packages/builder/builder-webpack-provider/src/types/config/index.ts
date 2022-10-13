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
/* eslint-enable @typescript-eslint/no-restricted-imports */
