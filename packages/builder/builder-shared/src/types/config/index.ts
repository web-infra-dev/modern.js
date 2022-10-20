import type { SharedDevConfig } from './dev';
import type { SharedHtmlConfig } from './html';
import type { SharedOutputConfig } from './output';
import type { SharedSourceConfig } from './source';
import type { SharedSecurityConfig } from './security';
import type { SharedPerformanceConfig } from './performance';

/**
 * The shared Builder Config.
 * Can be used with webpack-provider or rspack-provider.
 * */
export interface SharedBuilderConfig {
  dev?: SharedDevConfig;
  html?: SharedHtmlConfig;
  source?: SharedSourceConfig;
  output?: SharedOutputConfig;
  security?: SharedSecurityConfig;
  performance?: SharedPerformanceConfig;
}

export * from './dev';
export * from './html';
export * from './output';
export * from './source';
export * from './security';
export * from './performance';
