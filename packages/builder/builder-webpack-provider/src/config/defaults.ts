import {
  extendsType,
  mergeBuilderConfig,
  getDefaultDevConfig,
  getDefaultOutputConfig,
  getDefaultHtmlConfig,
  getDefaultSourceConfig,
  getDefaultSecurityConfig,
  getDefaultPerformanceConfig,
  getDefaultToolsConfig,
} from '@modern-js/builder-shared';
import type { BuilderConfig, NormalizedConfig } from '../types';

const defineDefaultConfig = extendsType<BuilderConfig>();

export const createDefaultConfig = (): NormalizedConfig =>
  defineDefaultConfig({
    dev: getDefaultDevConfig(),
    html: getDefaultHtmlConfig(),
    tools: {
      ...getDefaultToolsConfig(),
      cssExtract: {
        loaderOptions: {},
        pluginOptions: {},
      },
    },
    source: {
      ...getDefaultSourceConfig(),
      define: {},
    },
    output: getDefaultOutputConfig(),
    security: {
      ...getDefaultSecurityConfig(),
      sri: false,
    },
    experiments: {
      lazyCompilation: false,
    },
    performance: {
      ...getDefaultPerformanceConfig(),
      profile: false,
      removeMomentLocale: false,
    },
  });

export const withDefaultConfig = (config: BuilderConfig) =>
  mergeBuilderConfig<BuilderConfig>(
    createDefaultConfig() as BuilderConfig,
    config,
  );
