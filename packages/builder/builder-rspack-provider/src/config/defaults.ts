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

// TODO: update
export const createDefaultConfig = () =>
  defineDefaultConfig({
    dev: defaultDevConfig,
    html: defaultHtmlConfig,
    source: {
      ...defaultSourceConfig,
      alias: {},
      define: {},
    },
    output: defaultOutputConfig,
    tools: {},
    security: {
      // sri: false
    },
    performance: {
      // profile: false,
      // buildCache: true,
      printFileSize: true,
      // removeConsole: false,
      // removeMomentLocale: false,
      // chunkSplit: {
      //   strategy: 'split-by-experience',
      // },
    },
  });

export const withDefaultConfig = (config: BuilderConfig) =>
  mergeBuilderConfig<BuilderConfig>(createDefaultConfig(), config);
