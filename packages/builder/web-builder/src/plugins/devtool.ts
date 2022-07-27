import { isProd } from '../shared';
import type { WebBuilderPlugin } from '../types';

export const PluginDevtool = (): WebBuilderPlugin => ({
  name: 'web-builder-plugin-devtool',

  setup(api) {
    api.modifyWebpackChain(chain => {
      const builderConfig = api.getBuilderConfig();

      if (builderConfig.output?.disableSourceMap) {
        chain.devtool(false);
      } else {
        const devtool = isProd() ? 'source-map' : 'cheap-module-source-map';
        chain.devtool(devtool);
      }
    });
  },
});
