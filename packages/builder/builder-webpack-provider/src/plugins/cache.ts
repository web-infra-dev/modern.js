import { join } from 'path';
import { isFileExists } from '@modern-js/builder-shared';
import type { BuilderPlugin } from '../types';

export const PluginCache = (): BuilderPlugin => ({
  name: 'builder-plugin-cache',

  setup(api) {
    api.modifyWebpackChain(async (chain, { target, env }) => {
      const buildCacheOption = api.getNormalizedConfig().performance.buildCache;
      if (buildCacheOption === false) {
        chain.cache(false);
        return;
      }
      const buildCacheConfig =
        typeof buildCacheOption === 'boolean' ? {} : buildCacheOption;
      const { context } = api;

      const cacheDirectory =
        buildCacheConfig?.cacheDirectory || join(context.cachePath, 'webpack');
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
