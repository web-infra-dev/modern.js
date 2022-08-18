import type { WebpackConfig } from '../../src/types';

export const isPluginRegistered = (config: WebpackConfig, pluginName: string) =>
  config.plugins?.some(item => item.constructor.name === pluginName);
