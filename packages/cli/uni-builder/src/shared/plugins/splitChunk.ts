import { isPlainObject, isPackageInstalled } from '@modern-js/utils';
import type { RsbuildPlugin, SplitChunks, CacheGroups } from '@rsbuild/core';

const DEP_MATCH_TEMPLATE = /[\\/]node_modules[\\/](<SOURCES>)[\\/]/.source;

const createDependenciesRegExp = (...dependencies: (string | RegExp)[]) => {
  const sources = dependencies.map(d => (typeof d === 'string' ? d : d.source));
  const expr = DEP_MATCH_TEMPLATE.replace('<SOURCES>', sources.join('|'));
  return new RegExp(expr);
};

function createCacheGroups(group: Record<string, (string | RegExp)[]>) {
  const experienceCacheGroup: CacheGroups = {};
  for (const [name, pkgs] of Object.entries(group)) {
    const key = `lib-${name}`;
    experienceCacheGroup[key] = {
      test: createDependenciesRegExp(...pkgs),
      priority: 0,
      name: key,
      reuseExistingChunk: true,
    };
  }
  return experienceCacheGroup;
}

export const pluginSplitChunks = (): RsbuildPlugin => ({
  name: 'uni-builder:split-chunks',

  setup(api) {
    api.modifyBundlerChain((chain, { environment }) => {
      const { config } = environment;
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
