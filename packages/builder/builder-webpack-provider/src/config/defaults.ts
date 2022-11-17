import {
  extendsType,
  mergeBuilderConfig,
  defaultDevConfig,
  defaultOutputConfig,
  defaultHtmlConfig,
  defaultSourceConfig,
} from '@modern-js/builder-shared';
import type { BuilderConfig } from '../types';

const defineDefaultConfig = extendsType<BuilderConfig>();

export const createDefaultConfig = () =>
  defineDefaultConfig({
    dev: defaultDevConfig,
    html: defaultHtmlConfig,
    tools: {
      cssExtract: {
        loaderOptions: {},
        pluginOptions: {},
      },
      tsChecker: true,
    },
    source: defaultSourceConfig,
    output: defaultOutputConfig,
    security: { sri: false },
    experiments: {},
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
