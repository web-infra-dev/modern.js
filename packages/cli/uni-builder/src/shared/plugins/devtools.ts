import { logger } from '@modern-js/utils';
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
    // priority order
    // 1. output.sourceMap.js, if this value is set, we won't apply this plugin and let rsbuild handles it
    const devtoolJs = options.sourceMap?.js;
    if (devtoolJs) {
      if (!isUseJsSourceMap(options.disableSourceMap)) {
        logger.warn(
          'Detected that `output.sourceMap` and `output.disableSourceMap` are used together, use the value of `output.sourceMap`',
        );
      }
      return;
    }
    api.modifyBundlerChain((chain, { isProd, isServer }) => {
      // 2. output.disableSourceMap
      if (!isUseJsSourceMap(options.disableSourceMap)) {
        chain.devtool(false);
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
