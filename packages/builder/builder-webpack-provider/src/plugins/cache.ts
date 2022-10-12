import { join } from 'path';
import { isFileExists } from '../shared';
import type { BuilderPlugin } from '../types';

export const PluginCache = (): BuilderPlugin => ({
  name: 'webpack-builder-plugin-cache',

  setup(api) {
    api.modifyWebpackChain(async (chain, { target, env }) => {
      const { context } = api;
      const buildCacheOptions = api.getBuilderConfig().performance?.buildCache;
      const cacheDirectory =
        buildCacheOptions?.cacheDirectory || join(context.cachePath, 'webpack');
      const rootPackageJson = join(context.rootPath, 'package.json');
      const browserslistConfig = join(context.rootPath, '.browserslistrc');

      /**
       * webpack can't detect the changes of framework config, tsconfig and browserslist config.
       * but they will affect the compilation result, so they need to be added to buildDependencies.
       */
      const buildDependencies: Record<string, string[]> = {
        packageJson: [rootPackageJson],
      };
      if (context.configPath) {
        buildDependencies.config = [context.configPath];
      }
      if (context.tsconfigPath) {
        buildDependencies.tsconfig = [context.tsconfigPath];
      }
      if (await isFileExists(browserslistConfig)) {
        buildDependencies.browserslistrc = [browserslistConfig];
      }

      chain.cache({
        // The default cache name of webpack is '${name}-${env}', and the `name` is `default` by default.
        // We set cache name to avoid cache conflicts of different targets.
        name: `${target}-${env}`,
        type: 'filesystem',
        cacheDirectory,
        buildDependencies,
      });
    });
  },
});
