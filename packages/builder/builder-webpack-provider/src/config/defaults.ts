import {
  extendsType,
  mergeBuilderConfig,
  getDefaultDevConfig,
  getDefaultOutputConfig,
  getDefaultHtmlConfig,
  getDefaultSourceConfig,
} from '@modern-js/builder-shared';
import type { BuilderConfig } from '../types';

const defineDefaultConfig = extendsType<BuilderConfig>();

export const createDefaultConfig = () =>
  defineDefaultConfig({
    dev: getDefaultDevConfig(),
    html: getDefaultHtmlConfig(),
    tools: {
      cssExtract: {
        loaderOptions: {},
        pluginOptions: {},
      },
      tsChecker: {},
    },
    source: {
      ...getDefaultSourceConfig(),
      alias: {},
      define: {},
    },
    output: getDefaultOutputConfig(),
    security: { sri: false, checkSyntax: false },
    experiments: {
      lazyCompilation: false,
    },
    performance: {
      profile: false,
      buildCache: true,
      printFileSize: true,
      removeConsole: false,
      removeMomentLocale: false,
      chunkSplit: {
        strategy: 'split-by-experience',
      },
    },
  });

export const withDefaultConfig = (config: BuilderConfig) =>
  mergeBuilderConfig<BuilderConfig>(createDefaultConfig(), config);
