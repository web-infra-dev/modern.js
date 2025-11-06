import type { RsbuildPlugin, SourceMap } from '@rsbuild/core';

export const pluginDevtool = (options: {
  sourceMap?: SourceMap | boolean;
}): RsbuildPlugin => ({
  name: 'builder:devtool',

  setup(api) {
    /**
     * If `output.sourceMap` is a boolean(means user specify the value) or `output.sourceMap.js` is setting
     * We won't apply this plugin and let Rsbuild handles JS sourceMap
     */
    const devtoolJs =
      typeof options.sourceMap === 'boolean' ||
      options.sourceMap?.js !== undefined;
    if (devtoolJs) {
      return;
    }

    api.modifyBundlerChain((chain, { isProd, isServer }) => {
      /**
       * The default value in Rsbuild of `devtool` is 'cheap-module-source-map' in development and `false` in production.
       * In Modern.js, we need to set it to 'cheap-module-source-map' in development and 'hidden-source-map' in production.
       * And in SSR Bundle, we need to set it to 'source-map' in production.
       */
      const prodDevTool = isServer ? 'source-map' : 'hidden-source-map';
      const devtool = isProd
        ? // hide the source map URL in production to avoid Chrome warning
          prodDevTool
        : 'cheap-module-source-map';
      chain.devtool(devtool);
    });
  },
});
