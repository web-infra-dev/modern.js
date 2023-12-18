import {
  getDefaultDevConfig,
  getDefaultHtmlConfig,
  getDefaultToolsConfig,
  getDefaultOutputConfig,
  getDefaultSourceConfig,
  getDefaultSecurityConfig,
  getDefaultPerformanceConfig,
  getDefaultExperimentsConfig,
  mergeUniBuilderConfig,
} from '../shared/defaults';
import type { UniBuilderRspackConfig } from '../types';

export const createDefaultConfig = (): UniBuilderRspackConfig => ({
  dev: getDefaultDevConfig(),
  html: getDefaultHtmlConfig(),
  source: getDefaultSourceConfig(),
  output: getDefaultOutputConfig(),
  tools: getDefaultToolsConfig(),
  security: getDefaultSecurityConfig(),
  performance: getDefaultPerformanceConfig(),
  experiments: getDefaultExperimentsConfig(),
});

export const withDefaultConfig = (config: UniBuilderRspackConfig) =>
  mergeUniBuilderConfig<UniBuilderRspackConfig>(createDefaultConfig(), config);
