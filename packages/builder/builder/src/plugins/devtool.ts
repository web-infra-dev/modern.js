import {
  isUseJsSourceMap,
  DefaultBuilderPlugin,
} from '@modern-js/builder-shared';

export const PluginDevtool = (): DefaultBuilderPlugin => ({
  name: 'builder-plugin-devtool',

  setup(api) {
    api.modifyBundlerChain((chain, { isProd }) => {
      const config = api.getNormalizedConfig();

      if (!isUseJsSourceMap(config)) {
        chain.devtool(false);
      } else {
        const devtool = isProd
          ? // hide the source map URL in production to avoid Chrome warning
            'hidden-source-map'
          : 'cheap-module-source-map';
        chain.devtool(devtool);
      }
    });
  },
});
