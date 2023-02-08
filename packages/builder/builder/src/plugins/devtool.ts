import {
  isUseJsSourceMap,
  DefaultBuilderPlugin,
} from '@modern-js/builder-shared';

export const builderPluginDevtool = (): DefaultBuilderPlugin => ({
  name: 'builder-plugin-devtool',

  setup(api) {
    api.modifyBundlerChain((chain, { isProd, isServer }) => {
      const config = api.getNormalizedConfig();

      if (!isUseJsSourceMap(config)) {
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
