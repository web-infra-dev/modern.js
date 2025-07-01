import type { RsbuildPlugin } from '@rsbuild/core';

// Preserve the default behavior of compilation scope to the current directory when using webpack.
// TODO: Remove this plugin in next major version.
export const pluginInclude = (): RsbuildPlugin => ({
  name: 'uni-builder:babel-include',

  setup(api) {
    api.modifyWebpackChain((chain, { CHAIN_ID }) => {
      const includes = chain.module.rule(CHAIN_ID.RULE.JS).include.values();
      includes.forEach(include => {
        if (
          typeof include === 'object' &&
          !Array.isArray(include) &&
          !(include instanceof RegExp) &&
          include.not &&
          include.not.toString() === /[\\/]node_modules[\\/]/.toString()
        ) {
          include.and = [api.context.rootPath, { not: include.not }];
          delete include.not;
        }
      });
    });
  },
});
