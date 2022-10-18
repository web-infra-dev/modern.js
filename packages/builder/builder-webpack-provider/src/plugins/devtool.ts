import type { BuilderPlugin } from '../types';

export const PluginDevtool = (): BuilderPlugin => ({
  name: 'builder-plugin-devtool',

  setup(api) {
    api.modifyWebpackChain((chain, { isProd }) => {
      const config = api.getNormalizedConfig();

      if (config.output.disableSourceMap) {
        chain.devtool(false);
      } else {
        const devtool = isProd ? 'source-map' : 'cheap-module-source-map';
        chain.devtool(devtool);
      }
    });
  },
});
