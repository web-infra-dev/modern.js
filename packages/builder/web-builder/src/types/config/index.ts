import type { WebBuilderDevConfig } from './dev';
import type { WebBuilderToolsConfig } from './tools';
import type { WebBuilderSourceConfig } from './source';
import type { WebBuilderOutputConfig } from './output';
import type { WebBuilderSecurityConfig } from './security';
import type { WebBuilderPerformanceConfig } from './performance';
import type { WebBuilderExperimentsConfig } from './experiments';

export interface WebBuilderConfig {
  dev?: WebBuilderDevConfig;
  tools?: WebBuilderToolsConfig;
  source?: WebBuilderSourceConfig;
  output?: WebBuilderOutputConfig;
  security?: WebBuilderSecurityConfig;
  performance?: WebBuilderPerformanceConfig;
  experiments?: WebBuilderExperimentsConfig;
}
