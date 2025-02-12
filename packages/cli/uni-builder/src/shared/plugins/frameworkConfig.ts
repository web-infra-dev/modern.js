import fs from 'node:fs';
import type { RsbuildPlugin } from '@rsbuild/core';

export const pluginFrameworkConfig = (configPath: string): RsbuildPlugin => ({
  name: 'uni-builder:framework-config',

  setup(api) {
    api.modifyBundlerChain(chain => {
      // TODO: Support rspack after support `performance.buildCache.buildDependencies` configuration
      if (!fs.existsSync(configPath) || api.context.bundlerType !== 'webpack') {
        return;
      }

      const cache = chain.get('cache');

      if (!cache) {
        return;
      }

      if (cache === true) {
        chain.cache({
          buildDependencies: {
            frameworkConfig: [configPath],
          },
        });
      }

      cache.buildDependencies = {
        ...cache.buildDependencies,
        frameworkConfig: [configPath],
      };

      chain.cache(cache);
    });
  },
});
