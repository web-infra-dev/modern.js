import type { RsbuildPlugin, SourceMap } from '@rsbuild/core';
import type { DisableSourceMapOption } from '../../types';

const isUseJsSourceMap = (disableSourceMap: DisableSourceMapOption = {}) => {
  if (typeof disableSourceMap === 'boolean') {
    return !disableSourceMap;
  }
  return !disableSourceMap.js;
};

export const pluginDevtool = (options: {
  disableSourceMap?: DisableSourceMapOption;
  sourceMap?: SourceMap;
}): RsbuildPlugin => ({
  name: 'uni-builder:devtool',

  setup(api) {
    api.modifyBundlerChain((chain, { isProd, isServer }) => {
      // priority order
      // 1. output.disableSourceMap
      if (!isUseJsSourceMap(options.disableSourceMap)) {
        chain.devtool(false);
        return;
      }

      // 2. output.sourceMap
      const devtoolJs = options.sourceMap?.js;
      if (devtoolJs) {
        chain.devtool(devtoolJs);
        return;
      }

      // 3. default behavior
      const prodDevTool = isServer ? 'source-map' : 'hidden-source-map';
      const devtool = isProd
        ? // hide the source map URL in production to avoid Chrome warning
          prodDevTool
        : 'cheap-module-source-map';
      chain.devtool(devtool);
    });
  },
});
