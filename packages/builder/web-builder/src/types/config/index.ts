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

export interface BuilderFinalConfig extends BuilderConfig {
  source: SourceConfig;
}
