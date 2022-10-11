import type { DevConfig } from './dev';
import type { HtmlConfig } from './html';
import type { ToolsConfig } from './tools';
import type { SourceConfig } from './source';
import type { OutputConfig } from './output';
import type { SecurityConfig } from './security';
import type { PerformanceConfig } from './performance';
import type { ExperimentsConfig } from './experiments';

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
