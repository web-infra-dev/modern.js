import {
  getDefaultDevConfig,
  getDefaultHtmlConfig,
  getDefaultToolsConfig,
  getDefaultOutputConfig,
  getDefaultSourceConfig,
  getDefaultSecurityConfig,
  getDefaultPerformanceConfig,
  getDefaultExperimentsConfig,
} from '../shared/defaults';
import { mergeRsbuildConfig } from '@rsbuild/shared';
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
  mergeRsbuildConfig<UniBuilderRspackConfig>(createDefaultConfig(), config);
