import { join } from 'path';
import type { BuilderPlugin } from '../types';

export const PluginCache = (): BuilderPlugin => ({
  name: 'webpack-builder-plugin-cache',

  setup(api) {
    api.modifyWebpackChain(chain => {
      const { context } = api;
      const cacheDirectory = join(context.cachePath, 'webpack');
      const buildDependencies: Record<string, string[]> = {};

      if (context.configPath) {
        buildDependencies.config = [context.configPath];
      }
      if (context.tsconfigPath) {
        buildDependencies.tsconfig = [context.tsconfigPath];
      }

      chain.cache({
        type: 'filesystem',
        cacheDirectory,
        buildDependencies,
      });
    });
  },
});
