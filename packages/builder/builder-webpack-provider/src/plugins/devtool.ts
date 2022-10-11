import type { BuilderPlugin } from '../types';

export const PluginDevtool = (): BuilderPlugin => ({
  name: 'builder-plugin-devtool',

  setup(api) {
    api.modifyWebpackChain((chain, { isProd }) => {
      const builderConfig = api.getBuilderConfig();

      if (builderConfig.output?.disableSourceMap) {
        chain.devtool(false);
      } else {
        const devtool = isProd ? 'source-map' : 'cheap-module-source-map';
        chain.devtool(devtool);
      }
    });
  },
});
