import { isAbsolute, join } from 'path';
import {
  BuildCacheOptions,
  BuilderContext,
  isFileExists,
} from '@modern-js/builder-shared';
import type { BuilderPlugin } from '../types';

async function validateCache(
  cacheDirectory: string,
  buildDependencies: Record<string, string[]>,
) {
  const { fs } = await import('@modern-js/utils');
  const configFile = join(cacheDirectory, 'buildDependencies.json');

  if (await isFileExists(configFile)) {
    const prevBuildDependencies = await fs.readJSON(configFile);

    if (
      JSON.stringify(prevBuildDependencies) ===
      JSON.stringify(buildDependencies)
    ) {
      return;
    }

    /**
     * If the filenames in the buildDependencies are changed, webpack will not invalidate the previous cache.
     * So we need to remove the cache directory to make sure the cache is invalidated.
     */
    await fs.remove(cacheDirectory);
  }

  await fs.outputJSON(configFile, buildDependencies);
}

function getCacheDirectory(
  { cacheDirectory }: BuildCacheOptions,
  context: BuilderContext,
  bundlerType: string,
) {
  if (cacheDirectory) {
    return isAbsolute(cacheDirectory)
      ? cacheDirectory
      : join(context.rootPath, cacheDirectory);
  }
  return join(context.cachePath, bundlerType);
}

export const PluginCache = (): BuilderPlugin => ({
  name: 'builder-plugin-cache',

  setup(api) {
    api.modifyBundlerChain(async (chain, { target, env, bundlerType }) => {
      const { buildCache } = api.getNormalizedConfig().performance;

      if (buildCache === false) {
        chain.cache(false);
        return;
      }

      const { context } = api;
      const cacheConfig = typeof buildCache === 'boolean' ? {} : buildCache;

      const cacheDirectory = getCacheDirectory(
        cacheConfig,
        context,
        bundlerType,
      );
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

      await validateCache(cacheDirectory, buildDependencies);

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
