import { fse } from '@rsbuild/shared';
import type { RsbuildPlugin } from '@rsbuild/core';

export const pluginFrameworkConfig = (configPath: string): RsbuildPlugin => ({
  name: 'uni-builder:framework-config',

  setup(api) {
    api.modifyBundlerChain(chain => {
      if (!fse.existsSync(configPath)) {
        return;
      }

      const cache = chain.get('cache');

      cache.buildDependencies = {
        ...cache.buildDependencies,
        frameworkConfig: [configPath],
      };

      chain.cache(cache);
    });
  },
});
