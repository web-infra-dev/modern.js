import { createCacheGroups, type SplitChunks } from '@rsbuild/shared';
import { isPlainObject, isPackageInstalled } from '@modern-js/utils';
import type { RsbuildPlugin } from '@rsbuild/core';

export const pluginSplitChunks = (): RsbuildPlugin => ({
  name: 'uni-builder:split-chunks',

  setup(api) {
    api.modifyBundlerChain(chain => {
      const config = api.getNormalizedConfig();
      const { chunkSplit } = config.performance || {};

      if (chunkSplit?.strategy !== 'split-by-experience') {
        return;
      }

      const currentConfig = chain.optimization.splitChunks.values();

      if (!isPlainObject(currentConfig)) {
        return;
      }

      const groups: Record<string, (string | RegExp)[]> = {};
      const { rootPath } = api.context;

      // Detect if the package is installed in current project
      // If installed, add the package to cache group
      if (isPackageInstalled('antd', rootPath)) {
        groups.antd = ['antd'];
      }
      if (isPackageInstalled('@arco-design/web-react', rootPath)) {
        groups.arco = [/@?arco-design/];
      }
      if (isPackageInstalled('@douyinfe/semi-ui', rootPath)) {
        groups.semi = [/@(ies|douyinfe)[\\/]semi-.*/];
      }

      if (!Object.keys(groups).length) {
        return;
      }

      chain.optimization.splitChunks({
        ...currentConfig,
        // rspack chunks type mismatch with webpack
        cacheGroups: {
          ...createCacheGroups(groups),
          ...(currentConfig as Exclude<SplitChunks, false>).cacheGroups,
        },
      });
    });
  },
});
