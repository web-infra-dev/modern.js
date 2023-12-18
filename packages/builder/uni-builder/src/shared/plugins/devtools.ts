import { RsbuildPlugin } from '@rsbuild/shared';
import { DisableSourceMapOption } from 'src/types';

const isUseJsSourceMap = (disableSourceMap: DisableSourceMapOption = {}) => {
  return typeof disableSourceMap === 'boolean'
    ? !disableSourceMap
    : !disableSourceMap.js;
};

export const pluginDevtool = (options: {
  disableSourceMap?: DisableSourceMapOption;
}): RsbuildPlugin => ({
  name: 'uni-builder:devtool',

  setup(api) {
    api.modifyBundlerChain((chain, { isProd, isServer }) => {
      if (!isUseJsSourceMap(options.disableSourceMap)) {
        chain.devtool(false);
      } else {
        const prodDevTool = isServer ? 'source-map' : 'hidden-source-map';
        const devtool = isProd
          ? // hide the source map URL in production to avoid Chrome warning
            prodDevTool
          : 'cheap-module-source-map';
        chain.devtool(devtool);
      }
    });
  },
});
