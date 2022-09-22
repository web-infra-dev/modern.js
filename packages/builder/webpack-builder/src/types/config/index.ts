import type { DevConfig, FinalDevConfig } from './dev';
import type { HtmlConfig, FinalHtmlConfig } from './html';
import type { ToolsConfig, FinalToolsConfig } from './tools';
import type { SourceConfig, FinalSourceConfig } from './source';
import type { FinalOutputConfig, OutputConfig } from './output';
import type { SecurityConfig, FinalSecurityConfig } from './security';
import type { PerformanceConfig, FinalPerformanceConfig } from './performance';
import type { ExperimentsConfig, FinalExperimentsConfig } from './experiments';

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

export interface FinalConfig extends Required<BuilderConfig> {
  dev: FinalDevConfig;
  html: FinalHtmlConfig;
  tools: FinalToolsConfig;
  source: FinalSourceConfig;
  output: FinalOutputConfig;
  security: FinalSecurityConfig;
  performance: FinalPerformanceConfig;
  experiments: FinalExperimentsConfig;
}

/* eslint-disable @typescript-eslint/no-restricted-imports */
export * from './dev';
export * from './html';
export * from './tools';
export * from './source';
export * from './output';
export * from './security';
export * from './performance';
export * from './experiments';
/* eslint-enable @typescript-eslint/no-restricted-imports */
