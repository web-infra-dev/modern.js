import { join } from 'path';
import type { BuilderPlugin } from '../types';

export const PluginCache = (): BuilderPlugin => ({
  name: 'webpack-builder-plugin-cache',

  setup(api) {
    api.modifyWebpackChain(async chain => {
      const { context } = api;
      const cacheDirectory = join(context.cachePath, 'webpack');
      const rootPackageJson = join(context.rootPath, 'package.json');
      const browserslistConfig = join(context.rootPath, '.browserslistrc');

      /**
       * webpack can't detect the changes of framework config, tsconfig and browserslist config.
       * but they will affect the compilation result, so they need to be added to buildDependencies.
       */
      const buildDependencies: Record<string, string[]> = {
        packageJson: [rootPackageJson],
        browserslistrc: [browserslistConfig],
      };
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
