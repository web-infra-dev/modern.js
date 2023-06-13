import {
  extendsType,
  mergeBuilderConfig,
  getDefaultDevConfig,
  getDefaultHtmlConfig,
  getDefaultToolsConfig,
  getDefaultOutputConfig,
  getDefaultSourceConfig,
  getDefaultSecurityConfig,
  getDefaultPerformanceConfig,
} from '@modern-js/builder-shared';
import type { BuilderConfig, NormalizedConfig } from '../types';

const defineDefaultConfig = extendsType<BuilderConfig>();

export const createDefaultConfig = (): NormalizedConfig =>
  defineDefaultConfig({
    dev: getDefaultDevConfig(),
    html: getDefaultHtmlConfig(),
    source: {
      ...getDefaultSourceConfig(),
      define: {},
    },
    output: getDefaultOutputConfig(),
    tools: getDefaultToolsConfig(),
    security: getDefaultSecurityConfig(),
    performance: getDefaultPerformanceConfig(),
  });

export const withDefaultConfig = (config: BuilderConfig) =>
  mergeBuilderConfig<BuilderConfig>(
    createDefaultConfig() as BuilderConfig,
    config,
  );
