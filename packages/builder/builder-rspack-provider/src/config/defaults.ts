import {
  extendsType,
  mergeBuilderConfig,
  defaultDevConfig,
  defaultOutputConfig,
  defaultHtmlConfig,
  defaultSourceConfig,
} from '@modern-js/builder-shared';
import type { BuilderConfig, NormalizedSourceConfig } from '../types';

const defineDefaultConfig = extendsType<BuilderConfig>();

// TODO: update
export const createDefaultConfig = () =>
  defineDefaultConfig({
    dev: defaultDevConfig,
    html: defaultHtmlConfig,
    /** alias type in shared is not match */
    source: defaultSourceConfig as NormalizedSourceConfig,
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
